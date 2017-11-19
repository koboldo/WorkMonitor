import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-report-unaccepted-orders',
    templateUrl: './report-unaccepted-orders.component.html',
    styleUrls: ['./report-unaccepted-orders.component.css']
})
export class ReportUnacceptedOrdersComponent implements OnInit {

    engineers:User[] = [];

    items:MenuItem[] = [];

    orders:Order[];
    selectedOrder:Order;

    constructor(private woService:WOService,
                private userService:UserService,
                private workService:WorkTypeService,
                private dictService:DictService,
                private alertService:AlertService,
                private authSerice:AuthenticationService,
                private toolsService:ToolsService) {
    }

    ngOnInit() {
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);


        this.items = [
            {label: 'Brak opcji', icon: 'fa-arrow-circle-up', command: (event) => this.doNothing()}
        ];

        this.search();
    }

    search() {
        this.woService.getOrdersByStatus("IS"
        ).subscribe(orders => this.orders = orders);
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    private doNothing():void {
        console.log("Nothing to do");
    }
}
