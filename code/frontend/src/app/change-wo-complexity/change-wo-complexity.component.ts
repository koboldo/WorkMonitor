import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { Comments, commentAsSimpleString, commentAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';
import { Calendar } from '../_models/calendar';
import { TableSummary } from 'app/_models/tableSummary';


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
    cols: any;
    summary: TableSummary;
    
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
            {label: 'Zwiększ trudność', icon: 'fa fa-arrow-circle-up', command: (event) => this.changeComplexity(true)},
            {label: 'Zmniejsz trudność', icon: 'fa fa-arrow-circle-down', command: (event) => this.changeComplexity(false)},
            {label: 'Poprawa', icon: 'fa fa-bell', command: (event) => this.reassign()}
        ];
        this.cols = [
            { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"text-center-30"},
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-35"},
            { field: 'status', header: 'Status' ,sortable: true, filter:true,statusCode:true, class:"width-35", icon:true},
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-50"},
            { field: 'complexityCode', header: 'Zł.', hidden:false, sortable:true, filter:false,complexity:true, icon:true,class:"width-35 text-center" },
            { field: 'complexity', header: 'Wycena [H]' , hidden:false, sortable:true, filter:false,class:"width-50 text-center"},
            { field: 'mdCapex', header: 'CAPEX',hidden:false, sortable:true, filter:true,class:"width-35" },
            { field: 'price', header: 'Wartość', sortable:true, filter:true,class:"width-35 text-right", price:true}, 
            { field: 'assignee', header: 'Wykonawca',hidden:false, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' ,hidden:false, sortable:true, filter:true, class:"width-50"},
            { field: 'creationDate', header: 'Utw.',hidden:false, sortable:true , filter:true, class:"width-50"},
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-50"},
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icon:true, class:"width-20 text-center"},
            //hidden columns
            { field: 'sComments', header: 'Komentarz',hidden:true,  sortable:true , filter:true,class:"width-250", icon:true},
            { field: 'description', header: 'Opis',hidden:true,  filter:true ,class:"width-250"},      
            { field: 'isFromPool', header: 'Pula' ,hidden:true, sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},
            { field: 'protocolNo', header: 'Protokół',hidden:true, sortable:true, filter:true, class:"width-100" },        
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
            { field: 'ventureCompany', header: 'Inwestor',hidden:true, sortable:true , filter:true, class:"width-135"},
            { field: 'ventureDisplay', header: 'Zleceniodawca',hidden:true, sortable:true , filter:true, class:"width-135" },         
        ]
    }

    public getStatusIcon(statusCode: string): string {
    return this.toolsService.getStatusIcon(statusCode);
    }
    
    search() {
        this.woService.getOrdersByDates(
            this.toolsService.formatDate(this.lastModAfter, 'yyyy-MM-dd'),
            this.toolsService.formatDate(this.lastModBefore, 'yyyy-MM-dd')
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

        if (workType && workType.complexity >= 0) {
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
        this.summary = this.toolsService.createSummaryForOrdersTable(this.orders);
    }
//TODO perhaps comment service ?
    public getCancelOrHoldComment(order:Order):string {
        if (order.comments) {
            return commentCancelOrHoldAsString(order.comments);
        } else {

            return '';
        }
    }
}
export function commentCancelOrHoldAsString(comments: Comments): string {
    let comentsTab : string [] = [];
    comments.comments.forEach(element => {
        if (element.reason=== 'Anulowanie')
        {
            comentsTab.push(' '+element.sCreatedBy+": \"" +(element.text? element.text: '')+ "\"" );                       
        }

    });
    if (comentsTab.length>0)
    {
        return comentsTab.toString();
    }
    return comments.comments[comments.comments.length-1]? comments.comments[comments.comments.length-1].text: '';
    

}
