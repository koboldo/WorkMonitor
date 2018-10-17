import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { Comments, commentAsSimpleString, commentAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';
import { Calendar } from '../_models/calendar';


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

    displayDetailsDialog: boolean;
    displayReassignDialog: boolean;
    displayChangeComplexityDialog: boolean;
    complexityIncrease: boolean;

    /* statuses dict or autocompletion statuses */
    statuses:CodeValue[] = [];

    newComment: string;
    pl:Calendar;

    constructor(private woService:WOService,
                private userService:UserService,
                private workTypeService:WorkTypeService,
                private dictService:DictService,
                private toolsService: ToolsService,
                private alertService:AlertService,
                private authSerice:AuthenticationService) {
        this.lastModAfter = toolsService.getCurrentDateDayOperation(-45);
        this.lastModBefore = toolsService.getCurrentDateDayOperation(1);
        this.pl=new Calendar();
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.saveAndSearch(user));
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.statuses = this.dictService.getWorkStatuses();

        this.items = [
            {label: 'Zwiększ trudność', icon: 'fa-arrow-circle-up', command: (event) => this.changeComplexity(true)},
            {label: 'Zmniejsz trudność', icon: 'fa-arrow-circle-down', command: (event) => this.changeComplexity(false)},
            {label: 'Poprawa', icon: 'fa-bell', command: (event) => this.reassign()}
        ];

    }

    search() {
        this.woService.getOrdersByDates(
            this.lastModAfter.toISOString().substring(0, 10),
            this.lastModBefore.toISOString().substring(0, 10)
        ).subscribe(orders => this.processOrders(orders));
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    private saveAndSearch(user:User):void {
        if (user === null) {
            console.log("Probably logged out");
            return;
        }

        console.log("Logged as " + JSON.stringify(user));
        this.leader = user;
        this.search();
    }

    private reassign(): void {
        this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));

        this.newComment = undefined;

        this.editedOrder.status = this.dictService.getWorkStatus("AS");
        this.editedOrder.statusCode = "AS";

        this.displayReassignDialog = true;
    }

    private changeComplexity(increase:boolean):void {
        /*if (increase && this.selectedOrder.complexityCode !== "STD") {
            this.alertService.error("Zlecenie " + this.selectedOrder.workNo + " jest już " + this.selectedOrder.complexity + "!");
            return;
        } else if (!increase && this.selectedOrder.complexityCode === "STD") {
            this.alertService.error("Zlecenie " + this.selectedOrder.workNo + " jest już " + this.selectedOrder.complexity + "!");
            return;
        }*/

        this.newComment = undefined;
        this.complexityIncrease = increase;

        this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.dictService.getWorkStatus(this.editedOrder.typeCode);

        if (increase) {
            this.editedOrder.complexityCode = "HRD";
        } else {
            this.editedOrder.complexityCode = "STD";
        }

        let workType: WorkType = this.workTypeService.getWorkType(this.editedOrder.typeCode, this.editedOrder.officeCode, this.editedOrder.complexityCode);
        console.log("Changing complexity for workType: "+JSON.stringify(workType));

        if (workType && workType.complexity) {
            this.editedOrder.complexity = workType.complexity;     //this.dictService.getComplexities(this.editedOrder.complexityCode);
        } else {
            this.alertService.warn("Brak danych z parametryzacji...");
            this.editedOrder.complexity = 4;
        }

        this.displayChangeComplexityDialog = true;
    }

    doReassign(): void {
        this.addComment(this.editedOrder, false);
        this.saveOrder();
    }

    doChangeComplexity(): void {
        this.addComment(this.editedOrder, true);
        this.saveOrder();
    }

    private saveOrder():void {

        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.type = this.workTypeService.getWorkTypeDescription(this.editedOrder);

        this.storeOrder(this.editedOrder);

        this.displayChangeComplexityDialog = false;
        this.displayReassignDialog = false;
    }

    private addComment(order: Order, changeComplexity: boolean): void {
        if (!order.comments) {
            order.comments = new Comments(null);
        }

        let assignees: string = '';
        if (order.assigneeFull && order.assigneeFull.length > 0) {
            for (let user of order.assigneeFull) {
                assignees += user.firstName + ' ' + user.lastName + ", "
            }
        }

        let prefix: string = '';
        if (changeComplexity) {
            prefix += "Zmiana wyceny na "+order.complexity+"h";
        } else {
            prefix += "Poprawa WO";
        }

        if (order.assigneeFull) {
            prefix += " przypisanego do: "+assignees;
        } else {
            prefix += " nieprzypisanego,";
        }
        prefix +=  " będącego w stanie: "+order.status+", ";

        let justification: string = this.newComment ? prefix+this.newComment : prefix+"Brak uzasadnienia";
        commentAdd(order.comments, changeComplexity? "Wycena" : "Poprawa", this.leader, justification);
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


    private processOrders(orders:Order[]):void {
        let tmpOrders: Order[] = [];
        for (let order of orders) {
            if (order.statusCode !== 'CA' && order.statusCode !== 'SU') {
                tmpOrders.push(order);
            }
        }

        this.orders = tmpOrders;
    }
}
