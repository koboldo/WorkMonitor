import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { TableSummary } from 'app/_models/tableSummary';

@Component({
    selector: 'app-wo-list',
    templateUrl: './wo-list.component.html',
    styleUrls: ['./wo-list.component.css']
})
export class WoListComponent implements OnInit {

    list:Order[];
    vrs:User[] = [];
    engineers:User[] = [];

    displayDetailsDialog: boolean;
    selectedOrder: Order;
    cols: any;
    summary: TableSummary;
    _exportFileName: string;
    
    constructor(private toolsService: ToolsService,
                private woService: WOService,
                private userService:UserService,
                private workTypeService:WorkTypeService) {
    }

    ngOnInit() {
        this.userService.getVentureRepresentatives().subscribe(vrs => this.vrs = vrs);
        this.userService.getEngineersAndContractors().subscribe(engineers => this.engineers = engineers);
        this.cols = [          
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-35" },
            { field: 'mdCapex', header: 'CAPEX',hidden:false, sortable:true, filter:true, class:"width-35" },
            { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-35", icon:true },
            { field: 'type', header: 'Typ', sortable:true, filter:false, type:true, class:"width-50" },
            { field: 'isFromPool', header: 'Pula' ,hidden:false, sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center" },
            { field: 'magicIsFromPool', header: 'Pula',sortable:true, filter:true, class:"width-20 text-center", isMagicFromPool:true, icon:true },
            { field: 'price', header: 'Wartość', sortable:true, filter:true, class:"width-45 text-right", price:true },
            { field: 'poolRevenue', header: "Do puli", sortable:true, filter:true, class:"width-45 text-right", poolRevenue:true },
            { field: 'complexity', header: 'Wycena [H]' , hidden:false, sortable:true, filter:false,class:"width-50 text-center" },
            { field: 'protocolNo', header: 'Protokół',hidden:false, sortable:true, filter:true, class:"width-100" },
            { field: 'creationDate', header: 'Utw.',hidden:false, sortable:true, filter:true, class:"width-50" },
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-50" },
            { field: 'ventureCompany', header: 'Inwestor',hidden:false, sortable:true, filter:true, class:"width-135" },
            { field: 'ventureDisplay', header: 'Zleceniodawca',hidden:false, sortable:true, filter:true, class:"width-135" },
            { field: 'frontProcessingDesc', header: 'Powód',hidden:false, sortable:true, filter:false, class:"width-135" },
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icone:true, class:"width-35 text-center" },
            // hidden columns 
            { field: 'complexityCode', header: 'Zł.', hidden:true, sortable:true, filter:false,complexity:true, icon:true,class:"width-35 text-center" },              
            { field: 'assignee', header: 'Wykonawca',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' ,hidden:true, sortable:true, filter:true, class:"width-50" },           
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true },
            { field: 'officeCode', header: 'Biuro' ,hidden:true, sortable: true, filter:true, class:"text-center-30" },
            { field: 'sComments', header: 'Komentarz',hidden:true,  sortable:true, filter:true, class:"width-250", icon:true },
            { field: 'description', header: 'Opis',hidden:true,  filter:true ,class:"width-250" },              
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true, filter:true },             
        ]

    }

    @Input()
    set exportFileName(exportFileName: string) {
        this._exportFileName = exportFileName;
    }

    get exportFileName(): string {
        return this._exportFileName;
    }

    @Input()
    set listToDisplay(orders: Order[]) {
        this.mapVentureRepresentative(orders, this.vrs);
        this.list = orders;
        this.summary = this.toolsService.createSummaryForOrdersTable(this.list);
    }

    get listToDisplay(): Order[] {
        return this.list;
    }

    public showWoDetails(event, order) {
        this.selectedOrder=order;
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
        this.displayDetailsDialog=true;
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
}
