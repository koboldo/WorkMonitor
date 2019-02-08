import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

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
    
    constructor(private toolsService: ToolsService,
                private woService: WOService,
                private userService:UserService,
                private workTypeService:WorkTypeService) {
    }

    ngOnInit() {
        this.userService.getVentureRepresentatives().subscribe(vrs => this.vrs = vrs);
        this.userService.getEngineersAndContractors().subscribe(engineers => this.engineers = engineers);
    }

    @Input()
    set ListToDisplay(orders: Order[]) {
        this.mapVentureRepresentative(orders, this.vrs);
        this.list = orders;
    }

    get ListToDisplay(): Order[] {
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
