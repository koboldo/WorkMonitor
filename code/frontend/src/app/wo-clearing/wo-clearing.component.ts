import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-wo-clearing',
    templateUrl: './wo-clearing.component.html',
    styleUrls: ['./wo-clearing.component.css']
})
export class WoClearingComponent implements OnInit {

    /* search and selection */
    lastModAfter:Date;
    lastModBefore:Date;
    orders:Order[];
    selectedOrders:Order[];

    displayClearingDialog:boolean;
    protocolNo: string;

    engineers:User[] = [];
    vrs:User[] = [];

    constructor(private woService:WOService,
                private userService:UserService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private alertService: AlertService) {
        this.lastModAfter = toolsService.getCurrentDateDayOperation(-365);
        this.lastModBefore = toolsService.getCurrentDateDayOperation(1);

    }

    ngOnInit() {
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(vrs => this.vrs = vrs);

        this.search();
    }

    search() {
        this.woService.getOrdersByDates(
            this.lastModAfter.toISOString().substring(0, 10),
            this.lastModBefore.toISOString().substring(0, 10)
        )
            .mergeMap(orders => this.callVentures(orders))
            .subscribe(vrs => this.mapVentureRepresentative(this.orders, vrs));
    }

    private callVentures(orders:Order[]):Observable<User[]> {
        this.orders = [];

        for (let order of orders) {
            console.log("Checking status: "+order.statusCode);
            if (order.statusCode === "AC") {
                this.orders.push(order);
            }
        }
        return this.userService.getVentureRepresentatives();
    }

    private mapVentureRepresentative(orders:Order[], vrs:User[]):void {
        if (orders && orders.length > 0) {
            for (let order of orders) {
                for (let vr of vrs) {
                    if (order.ventureId === vr.id) {
                        order.ventureDisplay = vr.firstName + " " + vr.lastName;
                        order.ventureCompany = vr.company;
                        order.ventureFull = vr;
                    }
                }
            }
        }
    }

    showDialog() {
        this.displayClearingDialog = true;
    }

    saveOrders() {
        this.displayClearingDialog = false;
        for(let order of this.selectedOrders) {
            order.statusCode = "CL";
            order.protocolNo = this.protocolNo;
            console.log("clearing order "+order.workNo+" with code "+this.protocolNo);
        }
        this.storeOrders(this.selectedOrders, 0);
    }

    private storeOrders(orders:Order[], counter: number):void {
        console.log("changing orders["+orders.length+"]! for "+counter );

        if (counter < orders.length) {
            this.woService.updateOrder(orders[counter]).subscribe(updatedOrder => this.refreshTableAndRecuriveCall(updatedOrder, counter, orders))
        } else {
            this.alertService.success("Pomyślnie przypisano protokół "+this.protocolNo+" dla "+orders.length+" zleceń");
            this.mapVentureRepresentative(this.orders, this.vrs);
        }
    }

    private refreshTableAndRecuriveCall(order:Order, counter:number, orders:Order[]) {
        console.log("Refreshing table with order " + JSON.stringify(order));


        if (order.id > 0) {
            let index:number = this.toolsService.findSelectedOrderIndex(order, this.orders);
            console.log("refresh index: " + index);
            this.orders[index] = order;
            this.orders = JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
            this.alertService.success("Pomyślnie nadano protokół "+order.protocolNo+" dla zlecenia " + order.workNo);
            this.storeOrders(orders, counter+1);
        } else {
            this.alertService.error("Nie można bylo odświeżyć tabeli wyników, szukaj jeszcze raz...");
        }

    }

}
