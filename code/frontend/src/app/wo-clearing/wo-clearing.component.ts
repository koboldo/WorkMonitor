import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';


import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

import { MenuItem, SelectItem } from 'primeng/primeng';
import { TableSummary } from 'app/_models/tableSummary';

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
    public ordersNotReady:Order[];
    public ordersReadyForProtocol:Order[];
    public displayOrderNotReadyDialog:boolean;
    public displayNotReadyForProtocolDetailsDialog:boolean;
    public selectedOrder: Order;
    public displayDetailsDialog: boolean;
    public cols: any;
    public colsForProtocol: any;
    public summary: TableSummary;
    public summaryForOffice: TableSummary;
    public summarySelected: TableSummary;
    public protocols: any [] = [];
    public filteredProtocols: any [] = [];
    public filter: any [] = [];
    public protocolIsSelected = true;
    public selected : any;
    public offices:SelectItem[] = [];
    public selectedOfficeCode: string;

    constructor(private woService:WOService,
                private userService:UserService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private alertService: AlertService,
                private workTypeService: WorkTypeService) {
    }

    ngOnInit() {
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(vrs => this.vrs = vrs);
        this.search();
        this.woService.getOrdersByStatus('IS').subscribe(Order=>this.addToTable(Order));
        this.woService.getProtocolCollection().subscribe(respons=> this.protocols = respons);
        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));
        this.cols = [
            { field: 'none', excludeGlobalFilter: true, sortable: false, filter:false,class:"width-35 text-center", check: true},
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-35"},
            { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-35", icon:true},
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-50"},
            { field: 'mdCapex', header: 'CAPEX',hidden:false, sortable:true, filter:true,class:"width-35" },
            { field: 'price', header: 'Wartość', sortable:true, filter:true,class:"width-35 text-right", price:true}, 
            // { field: 'protocolNo', header: 'Protokół',hidden:false, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-50"},
            { field: 'creationDate', header: 'Utw.',hidden:false, sortable:true , filter:true, class:"width-50"},
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-50"},
            { field: 'ventureCompany', header: 'Inwestor',hidden:false, sortable:true , filter:true, class:"width-135"},
            { field: 'ventureDisplay', header: 'Zleceniodawca',hidden:false, sortable:true , filter:true, class:"width-135" },
            // hidden columns 
            { field: 'complexityCode', header: 'Zł.', hidden:true, sortable:true, filter:false,complexity:true, icon:true,class:"width-35 text-center" },
            { field: 'complexity', header: 'Wycena [H]' , hidden:true, sortable:true, filter:false,class:"width-50 text-center"},      
            { field: 'assignee', header: 'Wykonawca',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' ,hidden:true, sortable:true, filter:true, class:"width-50"},           
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
            { field: 'officeCode', header: 'Biuro' ,hidden:true, sortable: true, filter:true,class:"text-center-30"},
            { field: 'sComments', header: 'Komentarz',hidden:true,  sortable:true , filter:true,class:"width-250", icon:true},
            { field: 'description', header: 'Opis',hidden:true,  filter:true ,class:"width-250"},      
            { field: 'isFromPool', header: 'Pula' ,hidden:true, sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},      
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true}, 
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icone:true, class:"text-center-30", exportable:false},
        ]
        this.colsForProtocol = [   
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-35"},         
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-50"},
            { field: 'mdCapex', header: 'CAPEX',hidden:false, sortable:true, filter:true,class:"width-35" },
            { field: 'price', header: 'Wartość', sortable:true, filter:true,class:"width-35 text-right", price:true}, 
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-50"},           
            { field: 'ventureCompany', header: 'Inwestor',hidden:false, sortable:true , filter:true, class:"width-50"},
            { field: 'ventureDisplay', header: 'Zleceniodawca',hidden:false, sortable:true , filter:true, class:"width-50" },
            // hidden columns 
            { field: 'creationDate', header: 'Utw.',hidden:true, sortable:true , filter:true, class:"width-50"},
            { field: 'protocolNo', header: 'Protokół',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'status', header: 'Status' , hidden:true, filter:true,statusCode:true, class:"width-35", icon:true},
            { field: 'complexityCode', header: 'Zł.', hidden:true, sortable:true, filter:false,complexity:true, icon:true,class:"width-35 text-center" },
            { field: 'complexity', header: 'Wycena [H]' , hidden:true, sortable:true, filter:false,class:"width-50 text-center"},      
            { field: 'assignee', header: 'Wykonawca',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' ,hidden:true, sortable:true, filter:true, class:"width-50"},           
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
            { field: 'officeCode', header: 'Biuro' ,hidden:true, sortable: true, filter:true,class:"text-center-30"},
            { field: 'sComments', header: 'Komentarz',hidden:true,  sortable:true , filter:true,class:"width-250", icon:true},
            { field: 'description', header: 'Opis',hidden:true,  filter:true ,class:"width-250"},      
            { field: 'isFromPool', header: 'Pula' ,hidden:true, sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},      
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},             
        ]
    
    }

    public showWoDetails(order) {
        this.selectedOrder = order;
        this.displayDetailsDialog = true;
    }

    public protocolSelected (event) {
        this.protocolIsSelected = false;
        this.protocolNo = event.protocolNo;
    }

    public getStatusIcon(statusCode: string): string {
        return this.toolsService.getStatusIcon(statusCode);
    }

    public filterCountry(event) {
        let filtered : any[] = [];
        for(let i = 0; i < this.protocols.length; i++) {
            let protocol = this.protocols[i];
            if(protocol.protocolNo.toLowerCase().indexOf(event.query.toLowerCase()) == 0) {
                filtered.push(protocol);
            }
        }
        this.filteredProtocols = filtered;
    }

    public onRowSelect(event) {
      this.summarySelected = this.toolsService.createSummaryForOrdersTable(this.selectedOrders);
    }

    public officeSelected (){
        this.woService.getOrdersByStatus('IS').subscribe(Order=>this.addToTable(Order));
    }

    private filterOrderByOfficeCode (officeCode: string) {
        this.ordersReadyForProtocol = this.ordersReadyForProtocol.filter(order => order.officeCode === officeCode);
        this.summaryForOffice = this.toolsService.createSummaryForOrdersTable(this.ordersReadyForProtocol);
        this.summarySelected = new TableSummary();
    }

    private mapToOffices(pairs:CodeValue[]):void {
        this.toolsService.mapToSelectItem(pairs, this.offices);
        this.selectedOfficeCode = 'WAW';       
    }

    private addToTable (ordersNotReady:Order[]) :void {
        this.ordersNotReady=[];
        this.ordersReadyForProtocol=[];
        for (let order of ordersNotReady ){      
            if (!this.toolsService.isReadyForProtocol(order,true)) {
              this.ordersNotReady.push(order)
            } else {
              this.ordersReadyForProtocol.push(order);
            }
        }
        this.mapVentureRepresentative(this.ordersNotReady,this.vrs);
        this.mapVentureRepresentative(this.ordersReadyForProtocol,this.vrs);
        this.filterOrderByOfficeCode(this.selectedOfficeCode);
    }

    public showNotReadyWoDetails() {
        this.displayNotReadyForProtocolDetailsDialog=true;
    }

    public fetchProtocol() {
        if (!this.protocolNo) {
          this.alertService.warn("Nie można wygenerować bez numeru!");
        } else {
            this.woService.fetchProtocol(this.protocolNo).
                subscribe(protocol => this.processProtocol(protocol, false));
        }
    }

    public search() {
        this.woService.getOrdersByStatus('IS')
            .pipe(mergeMap(orders => this.callVentures(orders)))
            .subscribe(vrs => this.mapVentureRepresentative(this.orders, vrs));
        this.selectedOrders = [];
    }

    public showDialog() {
        this.displayClearingDialog = true;
    }

    public prepareProtocol() {
        let ids: number[] = [];
        for(let order of this.selectedOrders) {
           ids.push(order.id);
        }
        console.log("Prepare protocol for ids=" + JSON.stringify(ids));
        this.woService.prepareProtocol(ids).
            subscribe(protocol => this.processProtocol(protocol, true));
        this.displayClearingDialog = false;
        this.selectedOrders = [];
    }

    private callVentures(orders:Order[]):Observable<User[]> {
        this.orders = orders;
        this.summary = this.toolsService.createSummaryForOrdersTable(this.orders);
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

    /* moved to backed
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
