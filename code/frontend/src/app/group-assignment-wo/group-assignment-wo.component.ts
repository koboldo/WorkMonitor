import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { WoComponent } from 'app/wo/wo.component';
import { User, Order, SearchUser } from 'app/_models';
import { ToolsService, WOService, DictService, AlertService, WorkTypeService, UserService } from '../_services';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-group-assignment-wo',
  templateUrl: './group-assignment-wo.component.html',
  styleUrls: ['./group-assignment-wo.component.css']
})
export class GroupAssignmentWoComponent implements OnInit {

  ordersToAssign: Order [];
  copyOrdersToAssign: Order [] = [];
  selectedOrders: Order [] = [];
  ordersNotAssign: Order [] = [];
  ordersSuccessAssign: Order [] = [];
  ordersStatusNotChange: Order [] = [];
  cols: any;

  /* autocompletion assignedEngineer */
  engineers: User[] = [];
  suggestedEngineers: SearchUser[];
  assignedEngineer: SearchUser;
  

  constructor(public toolsService: ToolsService,
              public workTypeService: WorkTypeService,
              private userService: UserService,
              private alertService: AlertService,
              private woService: WOService

    ) { }

  ngOnInit() {
    this.userService.getEngineersAndContractors().subscribe(engineers => this.engineers = engineers);
    this.cols = [
      { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-35", check: true},
      { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"text-center-55"}, 
      { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-100"},
      { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-100"},
      { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-135"},
      { field: 'complexityCode', header: 'Zł.', sortable:true, filter:false,complexity:true, icon:true,class:"text-center" },
      { field: 'complexity', header: 'Wycena' , sortable:true, filter:false,class:"text-center-55"},
      { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-100" },
      { field: 'price', header: 'Cena', sortable:true, filter:true,class:"width-70 text-right", price:true },     
      { field: 'assignee', header: 'Wykonawca', sortable:true, filter:true, class:"width-100" },
      { field: 'isFromPool', header: 'Pula' , sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},
      { field: 'protocolNo', header: 'Protokół', sortable:true, filter:true, class:"width-70" },
      { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-125"},
      { field: 'creationDate', header: 'Utw.', sortable:true , filter:true, class:"width-125"},
      { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-100"},
      // hidden columns
      { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
      { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
      { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
      { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
      { field: 'ventureCompany', header: 'Inwestor', sortable:true , filter:true, class:"width-100"},
      { field: 'ventureDisplay', header: 'Zleceniodawca', sortable:true , filter:true, class:"width-135" },
      { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
      { field: 'sComments', header: 'Komentarz', hidden:true, sortable:true , filter:true},
      { field: 'description', header: 'Opis', hidden:true, filter:true },
    ]

  }

  @Input()
  parent: WoComponent;  //this is null for

  @Input()
  operator: User;

  @Input()
  operatorMode: boolean;

  @Input()
  set listToDisplay(orders:Order[]) {
      this.ordersToAssign = orders;
      this.filtrOrders();
  }

  @Output()
  closeModalEvent = new EventEmitter<boolean>();


public assignOrders(){ 
    if (!this.selectedOrders || this.selectedOrders.length < 1 ) {
      if (!this.assignedEngineer || !this.selectedOrders) {
         this.alertService.warn('Nie wybrano statusu lub zleceń do modyfikacji!'); 
      } else {
        if (this.ordersSuccessAssign.length > 0) {
            this.alertService.success('Pomyślnie przypisano zlecenia ' + this.toPrintableString(this.ordersSuccessAssign) + ' do ' + this.assignedEngineer.user.email) ;
        }
        if (this.ordersNotAssign.length > 0) {
            this.alertService.error('Nie przypisano zleceń ' + this.toPrintableString(this.ordersNotAssign));
        }
        if (this.ordersStatusNotChange.length > 0) {
          this.alertService.error('Nie zmieniono satusu dla zleceń ' + this.toPrintableString(this.ordersNotAssign));
      }
    }
    this.onCloseModal();
  } else {
      let orderToAssign = this.selectedOrders.shift(); 
      this.userService.assignWorkOrder(this.assignedEngineer.user, orderToAssign ,true ).subscribe(
          succes => {
            console.log('Setting status to AS, current ' + orderToAssign.statusCode);
            orderToAssign.statusCode = 'AS'          
            this.woService.updateOrder(orderToAssign).subscribe(
              succes => {
                this.ordersSuccessAssign.push(orderToAssign);
                this.assignOrders();
              },
              err => {
                this.noteOrderNotAssign(orderToAssign, false);
                this.assignOrders();
              }
            );
          }, 
            err => {
              this.noteOrderNotAssign(orderToAssign, true);
              this.assignOrders();
          }       
      );     
    } 
  }

 private filtrOrders (){
    if (this.ordersToAssign != undefined){
      this.ordersToAssign.forEach(element => {
        if (element.statusCode === "OP" && element.assignee === undefined){
          this.copyOrdersToAssign.push(element);
        }
      });
    } 
  }
 private onCloseModal() {
    console.log('onCloseModal exec');
    this.finishAndClean();
    this.closeModalEvent.emit(false);
}

  public finishAndClean () {
    this.assignedEngineer = null;
    this.ordersToAssign = [];
    this.copyOrdersToAssign = [];
    this.selectedOrders = [];
    this.ordersNotAssign = [];
    this.ordersSuccessAssign = [];
    this.ordersStatusNotChange =[];
    this.parent.refresh();
  }

  private noteOrderNotAssign(order: Order, errorInAssign:boolean) {
    if (errorInAssign){
      this.ordersNotAssign.push(order);
    }
    else {
      this.ordersStatusNotChange.push(order);
    }
  }

  private toPrintableString(orders: Order[]): string {
    let result: string = '';
    for (let order of orders) {
        result += order.workNo+' T('+order.typeCode+'), ';
    }
    return result;
}

 public suggestEngineer(event): void {
      let suggestedEngineers:SearchUser[] = [];
      let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
      if (this.engineers && this.engineers.length > 0) {
          for (let engineer of this.engineers) {
              let suggestion:string = JSON.stringify(engineer).toLowerCase();
              if (suggestion.indexOf(queryIgnoreCase) > -1 ) {
                  let displayName:string = engineer.firstName + ' ' + engineer.lastName + ' (' + engineer.role + ')';
                  suggestedEngineers.push(new SearchUser(displayName, engineer));
              }
          }
      }
      this.suggestedEngineers = suggestedEngineers;
      console.log('suggestedEngineers ' + JSON.stringify(this.suggestedEngineers));
  }
}
