import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-my-wo',
    templateUrl: './my-wo.component.html',
    styleUrls: ['./my-wo.component.css']
})
export class MyWoComponent implements OnInit {

    engineer: User;
    engineers:User[] = [];

    orders:Order[];
    selectedOrder:Order;
    editedOrder:Order;

    items:MenuItem[] = [];

        displayFinishDialog: boolean;

    /* statuses dict or autocompletion statuses */
    statuses:CodeValue[] = [];

    constructor(private woService:WOService,
                private userService:UserService,
                private workService:WorkTypeService,
                private dictService:DictService,
                private alertService:AlertService,
                private authSerice:AuthenticationService) {

    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.saveAndSearch(user));
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.statuses = this.dictService.getWorkStatuses();

        this.items = [
            {label: 'Zakończ zlecenie', icon: 'fa-check', command: (event) => this.finishWork()}
        ];

    }

    search() {
        if (this.engineer.id) {
            this.woService.getAssignedOrders(this.engineer.id).subscribe(orders => this.orders = orders);
        } else {
            this.alertService.error("Nie można wyszukać, błąd wewnętrzny");
        }
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.getEngineers(this.selectedOrder.assignee);
    }

    private saveAndSearch(user:User):void {
        console.log("Logged as "+JSON.stringify(user));
        this.engineer = user;
        this.search();
    }

    private finishWork():void {
        this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
        this.editedOrder.statusCode = "CO";
        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.dictService.getWorkStatus(this.editedOrder.typeCode);

        this.displayFinishDialog = true;
    }

    saveOrder() {

        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.dictService.getWorkType(this.editedOrder.typeCode);

        this.storeOrder(this.editedOrder);

        this.displayFinishDialog = false;
    }

    private storeOrder(order:Order):void {
        console.log("changing order!" + JSON.stringify(order));
        this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder))
    }

    private refreshTable(order:Order) {
        console.log("Refreshing table removing order " + JSON.stringify(order));

        if (order && order.id > 0) {
            let index: number = 0;
            for(let anOrder of this.orders) {
                if (anOrder.id === order.id) {
                    this.orders.splice(index, 1);
                }
                index++;
            }
            this.alertService.success("Pomyślnie zakończono zlecenie " + order.workNo);
        } else {
            this.alertService.error("Nie można bylo odświeżyć tabeli wyników, szukaj jeszcze raz");
        }
    }


    private getEngineers(emails:string[]):User[] {
        return this.engineers.filter(engineer => this.filterEnginner(engineer, emails));
    }

    private filterEnginner(engineer:User, emails:String[]):boolean {
        if (emails === undefined || emails.length < 1) {
            return false;
        }
        return emails.indexOf(engineer.email) > -1;
    }
}
