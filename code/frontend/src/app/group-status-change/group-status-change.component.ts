import { Component, OnInit, Input, Output, EventEmitter, Inject, forwardRef } from '@angular/core';
import { ToolsService, WOService, DictService, AlertService } from '../_services';
import { Order, CodeValue, commentAdd, Comments, User } from '../_models';

@Component({
  selector: 'app-group-status-change',
  templateUrl: './group-status-change.component.html',
  styleUrls: ['./group-status-change.component.css']
})
export class GroupStatusChangeComponent implements OnInit {

  ordersToChange:Order [];
  selectedOrders:Order [];
  ordersNotChange:Order [] = [];
  operator:User;

  /* autocompletion statuses */
  statuses:CodeValue[] = [];
  suggestedStatuses:CodeValue[];
  status:CodeValue;

  editedOrder:Order;
  newComment:string;
  showModal:boolean;

  constructor(
    private toolsService: ToolsService,
    private woService: WOService,
    private alertService:AlertService,
    private dictService:DictService
    ){ }

  ngOnInit() {
    this.statuses = this.dictService.getWorkStatuses();
   
  }

  @Input()
    set ListToDisplay(orders: Order[]) {
            this.ordersToChange = orders;        
    }
    get ListToDisplay(): Order[] {
        return this.ordersToChange;
    }

  @Input ()
    set Operator(operator:User) {
      this.operator=operator;
    }
    get Operator(): User {
      return this.operator;
    }

    @Output() closeModalEvent = new EventEmitter<boolean>();
  
    onCloseModal(){
      this.closeModalEvent.emit(false);  
     }
   
    suggestStatus(event) {
      if ( this.operator.roleCode.indexOf('OP') > -1)
      {
        let suggestedStatuses: CodeValue[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1) 
                    suggestedStatuses.push(status);
            }
        }
        this.suggestedStatuses = suggestedStatuses;
        console.log('suggestedStatuses: ' + JSON.stringify(this.suggestedStatuses));
      }
      else 
      {
        let suggestedStatuses: CodeValue[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1 && status.code==="CO") 
                    suggestedStatuses.push(status);
            }
        }
        this.suggestedStatuses = suggestedStatuses;
        console.log('suggestedStatuses: ' + JSON.stringify(this.suggestedStatuses));
      }
      
  }

  isStatusAllowed(order: Order, statusCode: string) {
    if (statusCode === 'IS' && this.toolsService.isReadyForProtocol(order,false)) {
        return true;
    } else if (order.assignee && order.assignee.length > 0) {
        return true;
    } else if (statusCode === 'OP' || statusCode === 'CL' || statusCode === 'SU') {
        return true;
    }
    return false;
  }

  addCommment (order:Order) :void {
    if (this.newComment && this.newComment.length > 0) {
      if (!order.comments) {
          order.comments = new Comments(null);
      }
      let reason: string = (this.status.code === 'SU' || this.status.code === 'CA') ? "Anulowanie" : "Edycja";
      commentAdd(order.comments, reason, this.operator, this.newComment);
    }
    console.log(order.comments);
  }

  public ChangeStatus () {
      if (this.selectedOrders && this.status && this.status.code) {
      let orders:Order [] = [];
      let info:string;
      let ordersChange: Order [] =[] ;
      orders=this.selectedOrders;
      
        orders.forEach(order => {
          if (this.isStatusAllowed(order, this.status.code)) {
              order.statusCode=this.status.code;
              if (this.newComment!=null)       
                this.addCommment(order);
              this.woService.updateOrder(order).subscribe(
              succes=>
              this.alertService.info('Pomyślnie zmieniono status zlecenia '+ order.workNo),
              err =>
              this.noteOrderNotChange (order,true)                
            );
            
          }
        else {
          this.noteOrderNotChange (order,false)
        }
          
        });
        
    this.newComment=null;
    this.selectedOrders=null;
    this.onCloseModal();
    }

  }

  noteOrderNotChange (order:Order, isBackedError:boolean) {
    this.ordersNotChange.push(order);
    if (isBackedError) {
      this.alertService.error('Nie udało zmienić się statusu zlecenia '+ order.workNo + " Błąd aplikacji")
    }
    else {
      this.alertService.error('nie udalo sie zmienić statusu zlecenia '+ order.workNo +
      ' ze wzgledu na niedozwolone przejście z '+order.status +' do '+ this.status.paramChar);
    }
    
  }

}
