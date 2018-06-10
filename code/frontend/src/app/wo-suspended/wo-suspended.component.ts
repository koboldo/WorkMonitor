import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { Comments, commentCancelOrHoldAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';


@Component({
    selector: 'app-wo-suspended',
    templateUrl: './wo-suspended.component.html',
    styleUrls: ['./wo-suspended.component.css']
})
export class WoSuspendedComponent implements OnInit {

    engineers:User[] = [];

    items:MenuItem[] = [];
    operator: User;

    orders:Order[];
    selectedOrder:Order;
    displayDetailsDialog: boolean;

     //add comment
     newComment: string;
     displayAddComment: boolean;
     commentOrder:Order;
     // end add comment

    constructor(private woService:WOService,
                private userService:UserService,
                private dictService:DictService,
                private authSerice:AuthenticationService,
                private toolsService:ToolsService,
                private alertService:AlertService,
            ) {
    }

    ngOnInit() {
        this.items = [
            {label: 'Przywróć/Wnów', icon: 'fa-check', disabled: true, command: (event) => this.recover()},
            {label: 'Dodaj komentarz', icon: 'fa-pencil-square-o',  command: (event) => this.addComment()},
        ];

        this.authSerice.userAsObs.subscribe(user => this.assignOperator(user));
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);

        this.search();
    }

//add comment
private addComment():void{
    this.displayAddComment=true;    
 }
 saveComment (): void{
     if (this.newComment && this.newComment.length > 0) {
         this.addCommentToOrder(this.selectedOrder,this.newComment);            
     }
     this.displayAddComment=false;
     this.newComment=null;  
 }
private addCommentToOrder (order: Order, newComment: string) :void {
     let reason: string = 'Anulowanie';
     if (!order.comments) {
         order.comments = new Comments(null);
     }
     commentAdd(order.comments, reason, this.operator, newComment);
     this.woService.updateOrder(order).subscribe(order=>this.search());
     this.alertService.info('Pomyślnie dodano komentarz do zlecenia: ' + order.workNo);
     newComment=null;
     
}

//end add comment

    private assignOperator(operator:User):void {
        console.log('operator: '+JSON.stringify(operator));
        this.operator = operator;
        if (operator && operator.roleCode && operator.roleCode.indexOf('OP') > -1) {
            for(let item of this.items) {
                item.disabled = false;
            }
        }

    }

    search() {
        //fork JOIN with status CA, Cancelled should not be visible IMHO?
        this.woService.getOrdersByStatus("SU"
        ).subscribe(orders => this.orders = orders);
    }

    public showWoDetails(event, order) {
        this.selectedOrder=order;
        this.onRowSelect(event);
        this.displayDetailsDialog=true;
    }

    public getCancelOrHoldComment(order: Order): string {
        if (order.comments) {
            
            return commentCancelOrHoldAsString(order.comments);
        } else {
            
            return '';
        }
        
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    private recover():void {
        this.woService.getOrderHistoryById(this.selectedOrder.id).subscribe(history => this.updateWithLastStatusAndRefresh(history));
    }

    private updateWithLastStatusAndRefresh(history:OrderHistory[]):void {

        this.selectedOrder.statusCode = this.getLastStatusCode(history);
        this.woService.updateOrder(this.selectedOrder).subscribe(order => this.removeOrder(order));
    }

    private getLastStatusCode(history:OrderHistory[]):string {
        if (history && history.length > 0 && history[0].statusCode) {
            return history[0].statusCode;
        }
        return 'OP';
    }

    private removeOrder(order:Order):void {
        let newOrders: Order[] = [];
        console.log("Removing id "+order.id);
        for (let order of this.orders) {
            if (order.id != this.selectedOrder.id) {
                newOrders.push(order);
            }
        }
        this.orders = newOrders;
    }
}
