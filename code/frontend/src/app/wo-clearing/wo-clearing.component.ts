import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';



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
    orders:Order[];
    selectedOrders:Order[];
    protocolNo: string;

    displayClearingDialog:boolean;
    //protocolNo: string;

    engineers:User[] = [];
    vrs:User[] = [];

    //filt for protocol
    public ordersNotReady:Order[];
    public ordersReadyForProtocol:Order[];
    public displayOrderNotReadyDialog:boolean;
    public displayDetailsDialog:boolean;
    public selectedOrder: Order;
    // end filt for protocol

    constructor(private woService:WOService,
                private userService:UserService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private alertService: AlertService) {
    }

    ngOnInit() {
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(vrs => this.vrs = vrs);
        this.search();
        this.woService.getOrdersByStatus('IS').subscribe(Order=>this.addToTable(Order));
    }

    // filtr for protocol 
    private addToTable (ordersNotReady:Order[]) :void
    {
        this.ordersNotReady=[];
        this.ordersReadyForProtocol=[];
        for (let order of ordersNotReady )
        {      
            if (!this.toolsService.isReadyForProtocol(order,true))
            {
                this.ordersNotReady.push(order)            
            }
            else
            {
                this.ordersReadyForProtocol.push(order);
            }       
        }
        this.mapVentureRepresentative(this.ordersNotReady,this.vrs);
        this.mapVentureRepresentative(this.ordersReadyForProtocol,this.vrs);
    }
    public showWoDetails() {
        this.displayDetailsDialog=true;
    }
    // end filtr for protocol

    fetchProtocol() {
        if (!this.protocolNo) {
            this.alertService.warn("Nie można wygenerować bez numeru!");
        } else {
            this.woService.fetchProtocol(this.protocolNo).
                subscribe(protocol => this.processProtocol(protocol, false));
        }

    }

    search() {
        this.woService.getOrdersByStatus('IS')
            .mergeMap(orders => this.callVentures(orders))
            .subscribe(vrs => this.mapVentureRepresentative(this.orders, vrs));

        this.selectedOrders = [];
    }

    private callVentures(orders:Order[]):Observable<User[]> {
        this.orders = orders;
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

    prepareProtocol() {

        let ids: number[] = [];

        for(let order of this.selectedOrders) {
           ids.push(order.id);
        }

        console.log("Prepare protocol for ids="+JSON.stringify(ids));

        this.woService.prepareProtocol(ids).
            subscribe(protocol => this.processProtocol(protocol, true));

        this.displayClearingDialog = false;
        this.selectedOrders = [];
    }

    private processProtocol(protocol:any, refresh: boolean):void {
        if (protocol && protocol.file) {
            let protocolName: string = this.getProtocolName(protocol);
            this.toolsService.downloadXLSFile(protocolName, protocol.file);
            this.alertService.success("Wygenerowano protokół: '"+protocolName+"'", false);
            if (refresh) this.search();
        } else {
            this.alertService.error("Generacja protokołu niepowiodła się");
        }
    }

    private getProtocolName(protocol:any): string{
        if (protocol.name && protocol.name.length > 0) {
            return protocol.name;
        }

        console.log("protocol name is not set!");
        return "protokol.xslx";
    }

    /* mored to backed
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

    private refreshTableAndRecursiveCall(order:Order, counter:number, orders:Order[]) {
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
    */


}
