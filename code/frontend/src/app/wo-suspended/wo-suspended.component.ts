import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
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

    orders:Order[];
    selectedOrder:Order;
    displayDetailsDialog: boolean;

    constructor(private woService:WOService,
                private userService:UserService,
                private dictService:DictService,
                private toolsService:ToolsService) {
    }

    ngOnInit() {
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);

        this.items = [
            {label: 'Przywróć/Wnów', icon: 'fa-check', command: (event) => this.recover()}
        ];

        this.search();
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