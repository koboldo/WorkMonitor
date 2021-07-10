import { Component, OnInit, Input } from '@angular/core';

import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { Comments, commentCancelOrHoldAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';
import { TableSummary } from 'app/_models/tableSummary';

@Component({
    selector: 'app-wo-stopped-list',
    templateUrl: './wo-stopped-list.component.html',
    styleUrls: ['./wo-stopped-list.component.css']
})
export class WoStoppedListComponent implements OnInit {


    @Input()
    orderStatus: string;

    @Input()
    allowRecover: boolean;

    engineers:User[] = [];

    items:MenuItem[] = [];
    operator:User;

    orders:Order[];
    selectedOrder:Order;
    displayDetailsDialog:boolean;

    newComment:string;
    displayAddComment:boolean;
    commentOrder:Order;
    cols:any[] ;
    summary: TableSummary;


    constructor(private woService:WOService,
                private userService:UserService,
                public dictService:DictService,
                private authSerice:AuthenticationService,
                public toolsService:ToolsService,
                private alertService:AlertService,
                public workTypeService: WorkTypeService) {
                
    }

    ngOnInit() {
        this.cols = [
            { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"width-35 text-center"},
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true,exportable:false},
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-35 text-center"},
            { field: 'status', header: 'Status' ,sortable: true, filter:false,statusCode:true, class:"width-20 text-center", icon:true},
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-50"},
            { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-35" },
            { field: 'price', header: 'Cena', sortable:true, filter:true,class:"width-35 text-right", price:true},
            { field: 'complexityCode', header: 'Zł.', hidden:true, sortable:true, filter:false,complexity:true, icon:true,class:"width-35 text-center" },
            { field: 'complexity', header: 'Wycena' , hidden:true, sortable:true, filter:false,class:"width-35 text-center"},                              
            { field: 'sComments', header: 'Komentarz',  sortable:true , filter:false,class:"width-250", icon:true},
            { field: 'description', header: 'Opis',sortable: true,  filter:true ,class:"width-250"},
            { field: 'assignee', header: 'Wykonawca',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'isFromPool', header: 'Pula' ,hidden:true, sortable:true, filter:true, isFromPool:true, icon:true, class:"width-20 text-center"},
            { field: 'protocolNo', header: 'Protokół',hidden:true, sortable:true, filter:true, class:"width-100" },
            { field: 'lastModDate', header: 'Mod.' ,hidden:false, sortable:true, filter:true, class:"width-50"},
            { field: 'creationDate', header: 'Utw.',hidden:true, sortable:true , filter:true, class:"width-100"},
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-50"},
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
            { field: 'ventureCompany', header: 'Inwestor',hidden:true, sortable:true , filter:true, class:"width-135"},
            { field: 'ventureDisplay', header: 'Zleceniodawca',hidden:true, sortable:true , filter:true, class:"width-135" },
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icon:true, class:"width-20",exportable:false},
            
        ]
        
        this.items = [
            {label: 'Dodaj komentarz', icon: 'fa fa-pencil-square-o', command: (event) => this.addComment()}
        ];

        if (this.allowRecover) {
            this.items.push({label: 'Przywróć/Wznów', icon: 'fa fa-check', disabled: true, command: (event) => this.recover()});
        }

        this.authSerice.userAsObs.subscribe(user => this.assignOperator(user));
        this.dictService.init();
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);

        this.search();
    }

    //add comment
    private addComment():void {
        this.displayAddComment = true;
    }

    saveComment():void {
        if (this.newComment && this.newComment.length > 0) {
            this.addCommentToOrder(this.selectedOrder, this.newComment);
        }
        this.displayAddComment = false;
        this.newComment = null;
    }

    private addCommentToOrder(order:Order, newComment:string):void {
        let reason:string = 'Anulowanie';
        if (!order.comments) {
            order.comments = new Comments(null);
        }
        commentAdd(order.comments, reason, this.operator, newComment);
        this.woService.updateOrder(order).subscribe(order=>this.search());
        this.alertService.info('Pomyślnie dodano komentarz do zlecenia: ' + order.workNo);
        newComment = null;

    }

    //end add comment

    private assignOperator(operator:User):void {
        console.log('operator: ' + JSON.stringify(operator));
        this.operator = operator;
        if (operator && operator.roleCode && operator.roleCode.indexOf('OP') > -1) {
            for (let item of this.items) {
                item.disabled = false;
            }
        }

    }

    search() {
        this.woService.getOrdersByStatus(this.orderStatus).subscribe(orders =>{
            this.orders = orders ; 
            this.summary = this.toolsService.createSummaryForOrdersTable(this.orders);
        } );
        
    }

    public showWoDetails(event, order) {
        this.selectedOrder = order;
        this.onRowSelect(event);
        this.displayDetailsDialog = true;
    }

    public getCancelOrHoldComment(order:Order):string {
        if (order.comments) {

            return commentCancelOrHoldAsString(order.comments);
        } else {

            return '';
        }

    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    private recover():void {
        this.woService.getOrderHistoryById(this.selectedOrder.id).subscribe(history => this.updateWithLastStatusAndRefresh(history));
    }

    private updateWithLastStatusAndRefresh(history:OrderHistory[]):void {

        this.selectedOrder.statusCode = this.getLastStatusCode(history);
        this.woService.updateOrder(this.selectedOrder).subscribe(order => this.removeOrder(order));
    }

    private getLastStatusCode(history:OrderHistory[]):string {
        if (history && history.length > 0 && history[0].statusCode && history[0].statusCode != 'SU') {
            return history[0].statusCode;
        }
        return 'OP';
    }

    private removeOrder(order:Order):void {
        let newOrders:Order[] = [];
        console.log("Removing id " + order.id);
        for (let order of this.orders) {
            if (order.id != this.selectedOrder.id) {
                newOrders.push(order);
            }
        }
        this.orders = newOrders;
    }

}
