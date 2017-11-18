import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';


@Component({
    selector: 'app-change-wo-complexity',
    templateUrl: './change-wo-complexity.component.html',
    styleUrls: ['./change-wo-complexity.component.css']
})
export class ChangeWoComplexityComponent implements OnInit {
    leader:User;
    engineers:User[] = [];

    /* search and selection */
    lastModAfter:Date;
    lastModBefore:Date;

    orders:Order[];
    selectedOrder:Order;
    editedOrder:Order;

    items:MenuItem[] = [];

    displayChangeComplexityDialog:boolean;
    complexityIncrease: boolean;
    justification: string;

    /* statuses dict or autocompletion statuses */
    statuses:CodeValue[] = [];

    constructor(private woService:WOService,
                private userService:UserService,
                private workService:WorkTypeService,
                private dictService:DictService,
                private toolsService: ToolsService,
                private alertService:AlertService,
                private authSerice:AuthenticationService) {
        this.lastModAfter = toolsService.getCurrentDateDayOperation(-161); //TODO change
        this.lastModBefore = toolsService.getCurrentDateDayOperation(1);
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.saveAndSearch(user));
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.statuses = this.dictService.getWorkStatuses();

        this.items = [
            {label: 'Zwiększ trudność', icon: 'fa-arrow-circle-up', command: (event) => this.changeComplexity(true)},
            {label: 'Zmniejsz trudność', icon: 'fa-arrow-circle-down', command: (event) => this.changeComplexity(false)}
        ];

    }

    search() {
        this.woService.getOrdersByDates(
            this.lastModAfter.toISOString().substring(0, 10),
            this.lastModBefore.toISOString().substring(0, 10)
        ).subscribe(orders => this.orders = orders);
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    private saveAndSearch(user:User):void {
        console.log("Logged as " + JSON.stringify(user));
        this.leader = user;
        this.search();
    }

    private changeComplexity(increase:boolean):void {
        if (increase && this.selectedOrder.complexityCode !== "STD") {
            this.alertService.error("To zlecenie " + this.selectedOrder.workNo + " jest już " + this.selectedOrder.complexity + "!");
        } else if (!increase && this.selectedOrder.complexityCode === "STD") {
            this.alertService.error("To zlecenie " + this.selectedOrder.workNo + " jest już " + this.selectedOrder.complexity + "!");
        }

        this.justification = "";
        this.complexityIncrease = increase;

        this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.dictService.getWorkStatus(this.editedOrder.typeCode);
        this.editedOrder.comment ?
            this.editedOrder.comment += this.getComment(increase, this.editedOrder, this.leader):
            this.editedOrder.comment = this.getComment(increase, this.editedOrder, this.leader);

        if (increase) {
            this.editedOrder.complexityCode = "HRD";
        } else {
            this.editedOrder.complexityCode = "STD";
        }
        this.editedOrder.complexity = this.dictService.getComplexities(this.editedOrder.complexityCode);

        this.displayChangeComplexityDialog = true;
    }

    private getComment(increase: boolean, order: Order, leader: User) : string {
        let assigners: string = "";
        for(let email of order.assignee) {
            assigners += email+",";
        }

        let text: string =
            "\n----------------\n"+
            "W dniu "+new Date().toLocaleString()+" "+
            leader.firstName+" "+leader.lastName+
            (increase? " zwiększył(a)": " zmniejszył(a)")+
            " trudność zlecenia przypisanego do "+ assigners+
            " będącego w statusie "+order.status;
        return text;

    }

    saveOrder() {

        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.dictService.getWorkType(this.editedOrder.typeCode);

        this.editedOrder.comment += "\n---------------- Uzasadnienie: "+this.justification;

        this.storeOrder(this.editedOrder);

        this.displayChangeComplexityDialog = false;
    }

    private storeOrder(order:Order):void {
        console.log("changing order!" + JSON.stringify(order));
        this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder))
    }

    private refreshTable(order:Order) {
        console.log("Refreshing table with order " + JSON.stringify(order));

        if (order !== undefined && order.id > 0) {
            let index:number = this.toolsService.findSelectedOrderIndex(order, this.orders);
            console.log("refresh index: " + index);
            this.orders[index] = order;
            this.orders = JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
            this.alertService.success("Pomyślnie zmieniono trudność zlecenia " + order.workNo);
            return;
        } else {
            this.alertService.error("Nie można bylo odświeżyć tabeli wyników, szukaj jeszcze raz");
        }
    }

}
