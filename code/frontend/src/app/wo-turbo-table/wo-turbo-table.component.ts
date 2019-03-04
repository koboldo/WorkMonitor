import { Component, OnInit } from '@angular/core';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { WoComponent } from 'app/wo/wo.component';
import { Order } from 'app/_models';
import { Observable } from 'rxjs';
import { TableSummary } from 'app/_models/tableSummary';

@Component({
  selector: 'app-wo-turbo-table',
  templateUrl: './wo-turbo-table.component.html',
  styleUrls: ['./wo-turbo-table.component.css']
})
export class WoTurboTableComponent  extends WoComponent implements OnInit {

   cols:any[] ;
   priceFilter: number;
   priceTimeout: any;
   tableFields:any;
   openOrders: number;
   assignedOrders: number;
   complitedOrders: number;
   closeOrders: number;
   issuedOrders: number;
   summaryPrice: number;
   summaryIsFromPool: number;
   summary: TableSummary;

   constructor( protected woService:WOService,
                protected userService:UserService,
                protected itemService:RelatedItemService,
                protected workTypeService:WorkTypeService,
                protected dictService:DictService,
                protected alertService:AlertService,
                protected authSerice:AuthenticationService,
                protected toolsService: ToolsService) {
                super(woService,userService,itemService,workTypeService,dictService,alertService,authSerice,toolsService);      
   }

   ngOnInit() :void {
      super.ngOnInit();
       this.cols = [
           { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"text-center-55"},
           { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
           { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-100"},
           { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-135"},
           { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-135"},
           { field: 'complexityCode', header: 'Zł.', sortable:true, filter:false,complexity:true, icon:true,class:"text-center" },
           { field: 'complexity', header: 'Wycena' , sortable:true, filter:false,class:"text-center-55"},
           { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-100" },
           { field: 'price', header: 'Cena', sortable:true, filter:false,class:"width-80 text-right"},
           { field: 'sComments', header: 'Komentarz', hidden:true, sortable:true , filter:true},
           { field: 'description', header: 'Opis', hidden:true, filter:true },
           { field: 'assignee', header: 'Wykonawca', sortable:true, filter:true, class:"width-100" },
           { field: 'isFromPool', header: 'Pula' , sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},
           { field: 'protocolNo', header: 'Protokół', sortable:true, filter:true, class:"width-100" },
           { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-100"},
           { field: 'creationDate', header: 'Utw.', sortable:true , filter:true, class:"width-100"},
           { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-125"},
           { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
           { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
           { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
           { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
           { field: 'ventureCompany', header: 'Inwestor', sortable:true , filter:true, class:"width-135"},
           { field: 'ventureDisplay', header: 'Zleceniodawca', sortable:true , filter:true, class:"width-135" },
           { field: 'none',excludeGlobalFilter: true , button: true, details:true, icone:true, class:"width-35"},
           { field: 'none',excludeGlobalFilter: true, button:true ,edit: true, icone:true, class:"width-35"},
       ]
       
    }

  public onPriceChange(event, tt) {
      if (this.priceTimeout) {
          clearTimeout(this.priceTimeout);
      }
      this.priceTimeout = setTimeout(() => {
          tt.filter(event.value, 'price', 'gt');
      }, 250);
      this.summary = this.toolsService.createSummaryForTable(this.orders);
      console.log(this.summary);
  }

  public getStatusIcon(statusCode: string): string {
    return this.toolsService.getStatusIcon(statusCode);
  }
  
  public showSummary() {
    this.countOrderByStatus(this.orders);
    this.countSummaryPrice(this.orders);
    this.countSummaryIsFromPool(this.orders);
  }

  private countOrderByStatus (orders : Order []) {
    this.openOrders = 0;
    this.assignedOrders = 0;
    this.complitedOrders = 0;
    this.closeOrders = 0;
    this.issuedOrders = 0;
    orders.forEach(element => {
      if (element.statusCode === 'OP') { this.openOrders ++ ;}
      if (element.statusCode === 'AS') {this.assignedOrders ++ ;}
      if (element.statusCode === 'CO') {this.complitedOrders ++;}
      if (element.statusCode === 'IS') {this.issuedOrders ++;}
      if (element.statusCode === 'CL') {this.closeOrders ++;}
    }); 
  }

 private countSummaryPrice (orders: Order []) {
    this.summaryPrice =0;
    orders.forEach(element => {
      if (element.price != undefined) {
        this.summaryPrice += element.price;
      }     
    });
  }
  
private countSummaryIsFromPool (orders: Order []) {
    this.summaryIsFromPool = 0;
    orders.forEach(element => {
      if (element.isFromPool === 'Y') {
        this.summaryIsFromPool ++;
      }
    });
  }
}
