import { Component, OnInit, ViewChild  } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';


import { User, RelatedItem, Order, WorkType, CodeValue, SearchUser } from '../_models/index';
import { Comments, commentAsSimpleString, commentAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

import { DataTable, MenuItem } from 'primeng/primeng';
import { Calendar } from '../_models/calendar';
import { TableSummary } from 'app/_models/tableSummary';
import { ExportService } from 'app/_services/export.service';

@Component({
    selector: 'app-wo',
    templateUrl: './wo.component.html',
    styleUrls: ['./wo.component.css']
})
export class WoComponent implements OnInit {

    /* search and selection */
    lastModAfter:Date;
    lastModBefore:Date;
    orders:Order[];
    selectedOrder:Order;

    /*  */
    editedOrder:Order;
    newOrder:boolean;
    isNewOrderOwner:boolean;
    generateWorkNoFlag: string;
    displayEditDialog:boolean;
    displayAssignDialog:boolean;
    displayDetailsDialog: boolean;
    items:MenuItem[] = [];

    /* autocompletion assignedEngineer */
    engineers:User[] = [];
    suggestedEngineers:SearchUser[];
    assignedEngineer:SearchUser;

    /* autocompletion ventureRepresentatives */
    ventureRepresentatives:User[] = [];
    suggestedVentureRepresentatives:SearchUser[];
    assignedVentureRepresentative:SearchUser;

    /* autocompletion workType */
    workTypes:CodeValue[] = [];
    suggestedTypes:CodeValue[];
    workType:CodeValue;
    additionalWorkTypes:CodeValue[];
    //this is related with addtionalPrice!

    /* autocompletion statuses */
    statuses:CodeValue[] = [];
    suggestedStatuses:CodeValue[];
    status:CodeValue;

    /* autocompletion relatedItem */
    relatedItems:RelatedItem[];
    suggestedRelatedItems:RelatedItem[];
    relatedItem:RelatedItem;
    relatedItemCopy:RelatedItem;

    /* autocompletion prize */
    workTypesDetails:WorkType[];
    suggestedPrice:CodeValue[];
    price:CodeValue;
    additionalPrices:CodeValue[];

    comment; string;
    newComment: string;

    operator :User;
    pl: Calendar;
    displayChangeStatusDialog: boolean;
    displayAssignmentDialog: boolean;
    cols:any ;
    summary: TableSummary;
    
    constructor(protected woService:WOService,
                protected userService:UserService,
                protected itemService:RelatedItemService,
                protected workTypeService:WorkTypeService,
                protected dictService:DictService,
                protected alertService:AlertService,
                protected authSerice:AuthenticationService,
                protected toolsService: ToolsService,
                protected exportService: ExportService) {
        this.lastModAfter = toolsService.getCurrentDateDayOperation(-45);
        this.lastModBefore = toolsService.getCurrentDateDayOperation(0);
        this.items = [
            {label: 'Przypisz/Zmień wykonawce', icon: 'fa fa-user', disabled: true, command: (event) => this.assign(true)},
            {label: 'Dopisz wykonawce', icon: 'fa fa-share', disabled: true, command: (event) => this.assign(false)},
            {label: 'Edycja zlecenia', icon: 'fa fa-pencil-square-o', disabled: true, command: (event) => this.edit()},
            {label: 'Dodaj nowe zlecenie', icon: 'fa fa-plus', disabled: true, command: (event) => this.add()}
        ];
        this.relatedItem = <RelatedItem>{};
        this.pl=new Calendar();
    }

    ngOnInit() {
        this.userService.getEngineersAndContractors().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(ventureRepresentatives => this.ventureRepresentatives = ventureRepresentatives);
        this.itemService.getAllItems().subscribe(relatedItems => this.sortRelatedItems(relatedItems));
        this.workTypeService.getAllWorkTypes().subscribe(workTypesDetails => this.workTypesDetails = workTypesDetails);
        this.authSerice.userAsObs.subscribe(user => this.assignOperator(user));

        this.workTypeService.getWorkTypes().subscribe(workTypes => this.workTypes = workTypes);
        this.statuses = this.dictService.getWorkStatuses();
        
       
        this.search();
       
        this.cols = [
            { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"width-50 text-center"},
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true, exportable:false},
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-100 text-center"},
            { field: 'status', header: 'Status' ,sortable: true, filter:true,statusCode:true, class:"width-135 text-center"},
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-135 text-center" },
            { field: 'complexityCode', header: 'Zł.', sortable:true, filter:false,complexity:true, icon:true,class:"width-50 text-center" },
            { field: 'complexity', header: 'Wycena' , sortable:true, filter:false,class:"width-50 text-center"},
            { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-100 text-center" },
            { field: 'price', header: 'Cena', sortable:true, filter:true,class:"width-80 text-center", price:true},
            { field: 'sComments', header: 'Komentarz', hidden:true, sortable:true , filter:true},
            { field: 'description', header: 'Opis', hidden:true, filter:true },
            { field: 'assignee', header: 'Wykonawca', sortable:true, filter:true, class:"width-100 text-center" },
            { field: 'isFromPool', header: 'Pula' , sortable:true, filter:true, isFromPool:true, icon:true, class:"width-50 text-center"},
            { field: 'protocolNo', header: 'Protokół', sortable:true, filter:true, class:"width-100 text-center" },
            { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-100 text-center"},
            { field: 'creationDate', header: 'Utw.', sortable:true , filter:true, class:"width-100 text-center"},
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-125 text-center"},
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
            { field: 'ventureCompany', header: 'Inwestor', sortable:true , filter:true, class:"width-135 text-center"},
            { field: 'ventureDisplay', header: 'Zleceniodawca', sortable:true , filter:true, class:"width-135 text-center"},
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icone:true, class:"width-35 text-center",exportable:false},
            { field: 'none',excludeGlobalFilter: true, button:true ,edit: true, icone:true, class:"width-35 text-center", exportable:false},
        ]
      
    }
    public customExportCsv (table:DataTable) {
        let columnsToPipeFormat = [
            'complexity','price'];
        this.exportService.exportCsvWithPipe(table,columnsToPipeFormat);
    } 

    public getStatusIcon(statusCode: string): string {
        return this.toolsService.getStatusIcon(statusCode);
    }

    public showChangeStatusDialog() {
        this.displayChangeStatusDialog=true;
        this.assignedEngineer = undefined;
    }
    public showAssignmentDialog() {
        this.displayAssignmentDialog = true;
        this.assignedEngineer = undefined;
    }

    public onClose(isVisible: boolean){
        this.displayChangeStatusDialog = isVisible;
        this.displayAssignmentDialog = isVisible;
        this.search();
    }
 
    public assignOperator(operator:User):void {
        console.log('operator: '+JSON.stringify(operator));
        this.operator = operator;
        if (operator && operator.roleCode && operator.roleCode.indexOf('OP') > -1) {
            for(let item of this.items) {
                item.disabled = false;
            }
        }

    }

    refresh() {
        console.log('refreshing table...');
        this.lastModBefore = this.toolsService.getCurrentDateDayOperation(0);
        this.search();
    }

    search() {
        this.woService.getOrdersByDates(
            this.toolsService.formatDate(this.lastModAfter, 'yyyy-MM-dd'),
            this.toolsService.formatDate(this.lastModBefore, 'yyyy-MM-dd')
        ).pipe(mergeMap(orders => this.callVentures(orders)))
        .subscribe(vrs => this.mapVentureRepresentative(this.orders, vrs));
    }

    private callVentures(orders: Order[]):Observable<User[]> {
        //this.orders = orders;
        //filter
        this.orders = [];
        for (let order of orders) {
            if (order.statusCode !== 'CA' && order.statusCode != 'SU' && order.statusCode != 'TR') {
                this.orders.push(order);
            }
        }
        this.summary = this.toolsService.createSummaryForOrdersTable(this.orders);
        return this.userService.getVentureRepresentatives();
    }

    private mapVentureRepresentative(orders: Order[], vrs:User[]):void {
        for(let order of orders) {
            for(let vr of vrs) {
                if (order.ventureId === vr.id) {
                    order.ventureDisplay = vr.firstName+' '+vr.lastName;
                    order.ventureCompany = vr.company;
                    order.ventureFull = vr;
                }
            }
        }
    }

    copyRelatedItem(value: any) {
        console.log('copyRelatedItem ' + JSON.stringify(this.relatedItem));
        if (typeof this.relatedItem == 'string' || this.relatedItem instanceof String) {
            console.log('copyRelatedItem skipping due to string');
        } else {
            this.relatedItemCopy = JSON.parse(JSON.stringify(this.relatedItem));
        }
    }

    updateRelatedItem(value: any) {
        //this is tricky sometimes object sometimes string
        console.log('updateRelatedItem ' + JSON.stringify(this.relatedItem)+'\nJSON '+JSON.stringify(value));
        if (this.relatedItem !== undefined) {
            if (typeof value == 'string' || value instanceof String) {

                let existingItem: RelatedItem = this.getOriginalRelatedItemByNumber(<string> value);
                if (existingItem != null) {
                    this.relatedItem = existingItem;
                    return;
                }

                if (this.relatedItemCopy !== undefined) {
                    this.relatedItem = this.relatedItemCopy;
                } else {
                    this.relatedItem = <RelatedItem> {};
                }
                this.relatedItem.itemNo = ''+value;
                this.copyRelatedItem(this.relatedItem);
            }
        }
    }

    suggestPrice(event, workType: CodeValue) {
        console.log('all ' + JSON.stringify(this.workTypesDetails));

        let suggestedPrice: CodeValue[] = [];
        if (this.workTypesDetails && this.workTypesDetails.length > 0) {
            for (let workTypeDetails of this.workTypesDetails) {
                let sPrice:string = <string> '' + workTypeDetails.price;
                if (sPrice.indexOf(event.query) > -1 && (workTypeDetails.typeCode === workType.code || workType.code === undefined) && workTypeDetails.officeCode === this.assignedVentureRepresentative.user.officeCode && workTypeDetails.complexityCode === 'STD') {
                    //let type: string = this.dictService.getWorkType(workTypeDetails.typeCode);
                    //suggestedPrice.push(new CodeValue(sPrice, sPrice + ' PLN (cennik ' + this.dictService.getOffice(workTypeDetails.officeCode) + ')'));
                    suggestedPrice.push(new CodeValue(sPrice, sPrice + ' PLN'));
                }
            }
        }
        this.suggestedPrice = suggestedPrice;
        console.log('suggestedWorkTypeDetails: ' + JSON.stringify(this.suggestedPrice));
    }

    suggestRelatedItem(event) {
        //console.log('all ' + JSON.stringify(this.relatedItems));
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;

        let suggestedRelatedItems: RelatedItem[] = [];
        if (this.relatedItems && this.relatedItems.length > 0) {
            for (let item of this.relatedItems) {
                if (item.itemNo.toLowerCase().indexOf(queryIgnoreCase) > -1) {
                    suggestedRelatedItems.push(item);
                }
            }
        }
        this.suggestedRelatedItems = suggestedRelatedItems;
        //console.log('suggestedRelatedItems: ' + JSON.stringify(this.suggestedRelatedItems));
    }

    suggestStatus(event) {
        let suggestedStatuses: CodeValue[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1 && this.toolsService.isStatusAllowed(this.editedOrder, status.code)) {
                    suggestedStatuses.push(status);
                }
            }
        }
        this.suggestedStatuses = suggestedStatuses;
        //console.log('suggestedStatuses: ' + JSON.stringify(this.suggestedStatuses));
    }

    fillPrice(event: any, index: number): void {
        console.log("fillPrice "+JSON.stringify(event));

        if (this.workTypesDetails && this.workTypesDetails.length > 0) {
            for (let workTypeDetails of this.workTypesDetails) {
                let sPrice:string = <string> '' + workTypeDetails.price;
                if ((workTypeDetails.typeCode === event.code || event.code === undefined) && workTypeDetails.officeCode === this.assignedVentureRepresentative.user.officeCode && workTypeDetails.complexityCode === 'STD') {
                    if (index < 0) {
                        this.price = new CodeValue(sPrice, sPrice + ' PLN');
                    } else {
                        this.additionalPrices[index] = new CodeValue(sPrice, sPrice + ' PLN');
                    }
                    console.log("fillPrice found " + sPrice);
                }
            }
        }
    }

    suggestType(event): void {
        let suggestedTypes:CodeValue[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.workTypes && this.workTypes.length > 0) {
            for (let workType of this.workTypes) {
                if (workType.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1) {
                    suggestedTypes.push(workType);
                }
            }
        }

        this.suggestedTypes = suggestedTypes;
        //console.log('suggestedTypes: ' + JSON.stringify(this.suggestedTypes));
    }

    suggestEngineer(event): void {
        let suggestedEngineers:SearchUser[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.engineers && this.engineers.length > 0) {
            for (let engineer of this.engineers) {
                let suggestion:string = JSON.stringify(engineer).toLowerCase();
                //console.log('suggestEngineer ' + suggestion + ' for ' + JSON.stringify(event));
                if (suggestion.indexOf(queryIgnoreCase) > -1 && (this.editedOrder.assignee === undefined || this.editedOrder.assignee.indexOf(engineer.email) === -1)) {
                    let displayName:string = engineer.firstName + ' ' + engineer.lastName + ' (' + engineer.role + ')';
                    suggestedEngineers.push(new SearchUser(displayName, engineer));
                }
            }
        }
        this.suggestedEngineers = suggestedEngineers;
        //console.log('suggestedEngineers ' + JSON.stringify(this.suggestedEngineers));
    }

    suggestVentureRepresentative(event) {
        let suggestedVentureRepresentatives: SearchUser[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.ventureRepresentatives && this.ventureRepresentatives.length > 0) {
            for (let v of this.ventureRepresentatives) {
                let suggestion:string = JSON.stringify(v).toLowerCase();
                //console.log('suggestVentureRepresentative ' + suggestion + ' for ' + JSON.stringify(event));
                if (suggestion.indexOf(queryIgnoreCase) > -1) {
                    let displayName:string = v.firstName + ' ' + v.lastName + ' (' + v.company + ' - '+v.office+')';
                    suggestedVentureRepresentatives.push(new SearchUser(displayName, v));
                }
            }
        }
        this.suggestedVentureRepresentatives = suggestedVentureRepresentatives;
        //console.log('suggestedVentureRepresentatives ' + JSON.stringify(this.suggestedVentureRepresentatives));
    }

    public showWoDetails(event, order) {
        this.selectedOrder=order;
        this.onRowSelect(event);
        this.displayDetailsDialog=true;
    }

    onRowSelect(event) {
        console.log('selected row!' + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    onRowDblclick(event) {
        console.log('onRowDblclick row!' + JSON.stringify(this.selectedOrder));
        this.edit();
    }

    editOrder(order:Order) {
        this.selectedOrder = order;
        this.edit();
    }

    assign(isNewOrderOwner:boolean):void {
        console.log('assigning!' + JSON.stringify(this.selectedOrder));
        if (isNewOrderOwner && this.selectedOrder.assignee !== undefined) {
            this.alertService.warn('Zmiana wykonawcy zlecenia ' + this.selectedOrder.workNo + ', bieżący wykonawca/y' + this.selectedOrder.assignee);
        }
        if (isNewOrderOwner && this.selectedOrder.statusCode === 'CO') {
            this.alertService.error('Nie można przypisac zlecenia w stanie ' + this.selectedOrder.status);
        } else if (!isNewOrderOwner && this.selectedOrder.assignee === undefined) {
            this.alertService.error('Nie można DOPISAĆ do zlecenia gdyż nie ma jeszcze pierwszego wykonawcy!');
        } else {
            this.isNewOrderOwner = isNewOrderOwner;
            this.newOrder = false;
            this.editedOrder = this.selectedOrder;
            this.assignedEngineer = undefined;
            this.displayAssignDialog = true;
        }
    }


    add() {

        this.editedOrder = new Order(this.toolsService.NO_WO, 'OP', this.dictService.getWorkStatus('OP'), null, null, 'STD', -1, null, new Comments(null), this.toolsService.NO_CAPEX, null);
        this.additionalWorkTypes = [new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', '')];
        this.additionalPrices = [new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', '')];
        this.generateWorkNoFlag = 'Y';
        this.comment = undefined;
        this.newComment = undefined;

        this.status = new CodeValue(this.editedOrder.statusCode, this.editedOrder.status);

        this.relatedItem = <RelatedItem> {};
        this.relatedItemCopy = <RelatedItem> {};

        this.price = <CodeValue> {};
        this.workType = <CodeValue> {};
        this.newComment = undefined;

        this.newOrder = true;
        this.displayEditDialog = true;

        this.assignedEngineer = undefined;
    }

    edit():void {

        if (this.operator && this.operator.roleCode && this.operator.roleCode.indexOf('OP') > -1) {
            console.log('editing!' + JSON.stringify(this.selectedOrder));
            this.generateWorkNoFlag = 'N';
            this.comment = this.selectedOrder.comments ? commentAsString(this.selectedOrder.comments) : undefined;
            this.newComment = undefined;

            //initial values based on selectedOrder for form preparation
            let price:string = this.selectedOrder.price !== undefined ? '' + this.selectedOrder.price : '';
            this.price = new CodeValue(price, price);

            this.workType = new CodeValue(this.selectedOrder.typeCode, this.selectedOrder.type);
            this.status = new CodeValue(this.selectedOrder.statusCode, this.selectedOrder.status);
            this.relatedItem = (this.selectedOrder.relatedItems[0] === undefined ? <RelatedItem> {} : this.selectedOrder.relatedItems[0]);
            if (this.selectedOrder.ventureFull !== undefined && this.selectedOrder.ventureFull !== undefined) {
                this.assignedVentureRepresentative = new SearchUser(this.selectedOrder.ventureDisplay, this.selectedOrder.ventureFull);
            }

            this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
            this.additionalWorkTypes = [new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', '')];
            this.additionalPrices = [new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', ''), new CodeValue('', '')];

            this.newOrder = false;
            this.displayEditDialog = true;
            this.assignedEngineer = undefined;
        } else {
            this.alertService.warn('Brak uprawnień do edycji zlecenia!');
        }
    }

    saveAssignment() {
        console.log('saving assignment!' + JSON.stringify(this.editedOrder) + ' for ' + JSON.stringify(this.assignedEngineer.user));
        this.displayAssignDialog = false;
        this.userService.assignWorkOrder(this.assignedEngineer.user, this.editedOrder, this.isNewOrderOwner)
            .subscribe(json => this.updateOrderStatus(json.created, this.isNewOrderOwner, this.editedOrder, this.assignedEngineer.user));
    }

    synchronousSaveAssignment(order: Order, assignedEngineer: SearchUser) {
        console.log('Synchronous saving assignment!' + JSON.stringify(order) + ' for ' + JSON.stringify(assignedEngineer.user));
        this.isNewOrderOwner = true;
        this.displayAssignDialog = false;
        this.userService.assignWorkOrder(assignedEngineer.user, order, this.isNewOrderOwner).toPromise()
            .then(result => {
                this.updateOrderStatusObs(result['created'], this.isNewOrderOwner, order, assignedEngineer.user).toPromise()
                    .then(result => {
                        console.log('Status from promise!');
                    });
            });
    }

    private updateOrderStatusObs(created:number, isNewOrderOwner:boolean, order:Order, engineer:User):Observable<Order> {
        console.log('updateOrderStatus setting status to AS, current ' + order.statusCode + ' isNewOrderOwner:' + isNewOrderOwner);
        if (!created || created === -1) {
            console.log('Assignment problem! ' + created);
            this.alertService.error('Blad przypisania zlecenia ' + order.workNo + ' do ' + engineer.email);
            return;
        } else if (isNewOrderOwner && order.statusCode != 'AS') { //update status
            console.log('Setting status to AS, current ' + order.statusCode);
            order.statusCode = 'AS';
        }
        this.alertService.info('Pomyślnie przypisano zlecenie ' + order.workNo + ' do ' + engineer.email);

        //this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder, false));
        return this.woService.updateOrder(order);
    }

    private updateOrderStatus(created:number, isNewOrderOwner:boolean, order:Order, engineer:User):void {
        this.updateOrderStatusObs(created, isNewOrderOwner, order, engineer).subscribe(updatedOrder => this.refresh());
    }

    canSaveOrders(): boolean {
        return (
            this.assignedVentureRepresentative && this.assignedVentureRepresentative.user &&
            ((this.editedOrder && this.editedOrder.workNo && this.editedOrder.workNo.length > 2) || this.assignedVentureRepresentative.user.officeCode !== 'WAW') &&
            this.workType && this.workType.paramChar && this.workType.paramChar.length > 1
        );
    }

    saveOrders() {
        if (this.canSaveOrders()) {
            this.displayEditDialog = false;
            this.setWorkTypeAndPrice(this.editedOrder, this.workType, this.price);
            this.saveOrder(this.editedOrder, this.saveOrderSubscribeCallback);
        }
    }

    private saveOrder(order: Order, saveOrderCallback: (o: Order, that: WoComponent) => any): void {

        order.id            = this.newOrder ? undefined : order.id;
        order.statusCode    = this.newOrder ? 'OP' : this.status.code;
        order.status        = this.dictService.getWorkStatus(order.statusCode);

        if (this.newComment && this.newComment.length > 0) {
            if (this.newOrder || !order.comments) {
                order.comments = new Comments(null);
            }
            let reason: string = (order.statusCode === 'SU' || order.statusCode === 'CA') ? "Anulowanie" : "Edycja";
            commentAdd(order.comments, reason, this.operator, this.newComment);
        }

        if (this.toolsService.isStatusLowerThanProtocol(order.statusCode)) {
            order.protocolNo = ''; //According to ŁE its null for sqlite
        }

        if (this.assignedVentureRepresentative && this.assignedVentureRepresentative.user && this.assignedVentureRepresentative.user.id) {
            order.officeCode = this.assignedVentureRepresentative.user.officeCode;
            order.office = this.assignedVentureRepresentative.user.office;
            order.ventureId = this.assignedVentureRepresentative.user.id;
            if (order.officeCode !== 'WAW' && this.generateWorkNoFlag === 'Y') {
                this.editedOrder.workNo = undefined;
            }
            if (order.officeCode !== 'KAT') {
                order.mdCapex = undefined;
            }
        } else {
            this.alertService.error('Zlecenie nie zostało zapiasane, nieprawidlowy (pusty?) region zleceniodawcy!');
            return;
        }

        if (this.newOrder) {
            let workTypeParam: WorkType = this.workTypeService.getWorkType(order.typeCode, order.officeCode, 'STD');
            if (workTypeParam && workTypeParam.complexity != null) {
                order.complexity = workTypeParam.complexity;
            } else {
                console.log("workTypeParam = "+JSON.stringify(workTypeParam));
                this.alertService.error('Zlecenie nie zostało zapisane, brak pracochlonnosci w parametryzacji dla '+order.type+', '+order.officeCode+'!');
                return;
            }
            order.type = this.workTypeService.getWorkTypeDescription(order);
        }


        //trying to optimize all actions newOrder-newRelatedItem(noId), changeOrder-newRelatedItem(noId), newOrder-changeRelatedItem(Id), changeOrder-changeRelatedItem(Id)
        if (this.relatedItem.itemNo !== undefined && this.relatedItem.id !== undefined) {
            if (this.isRelatedItemChanged(this.relatedItem)) {
                console.log('changing existing relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
                this.itemService.updateItem(this.relatedItem).subscribe(item => {
                    this.storeOrder(item, order, this.newOrder, false).subscribe(order => {
                        if (this.assignedEngineer != null){
                            this.synchronousSaveAssignment(order, JSON.parse(JSON.stringify(this.assignedEngineer)));
                        }
                        saveOrderCallback(order, this);
                    })
                    this.refreshItems(item, false);
                });
            } else {
                console.log('no action on relatedItem but could be reassignment - this will be handled in storeOrder');
                this.storeOrder(this.relatedItem, order, this.newOrder, false).subscribe(order => {
                    if (this.assignedEngineer != null){
                        this.synchronousSaveAssignment(order, JSON.parse(JSON.stringify(this.assignedEngineer)));
                    }
                    saveOrderCallback(order, this);
                });
            }
        } else if (this.relatedItem.itemNo !== undefined && this.relatedItem.id === undefined) {
            console.log('adding new relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
            this.itemService.addItem(this.relatedItem).subscribe(item => {
                this.storeOrder(item, order, this.newOrder, true).subscribe(order => {
                    if (this.assignedEngineer != null){
                        this.synchronousSaveAssignment(order, JSON.parse(JSON.stringify(this.assignedEngineer)));
                    }
                    saveOrderCallback(order, this);
                })
                this.refreshItems(item, true);
            });
        } else {
            console.log('no action on relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
            this.storeOrder(this.relatedItem, order, this.newOrder, false).subscribe(order => {
                    if (this.assignedEngineer != null){
                        this.synchronousSaveAssignment(order, JSON.parse(JSON.stringify(this.assignedEngineer)));
                    }
                    saveOrderCallback(order, this);
            });
        }    
    }

    private storeOrder(item:RelatedItem, order:Order, newOrder:boolean, newItem:boolean):Observable<Order> {
        console.log('changing order related item to ' + item.id);
        order.itemId = item.id;

        if (newOrder) {
            console.log('saving new!' + JSON.stringify(order));
            return this.woService.addOrder(order)
        } else {
            console.log('changing!' + JSON.stringify(order));
            return this.woService.updateOrder(order);
        }
    }

    private saveOrderSubscribeCallback(order: Order, that: WoComponent) {
        if (order.statusCode === 'OP') {
            that.removeAssignment(order, that);
        }

        if (that.additionalWorkTypes.length > 0 && that.additionalWorkTypes[0].code !== '') {
            console.log('Still work todo, up to '+that.additionalWorkTypes.length +", order.workNo: "+order.workNo);
            let nextOrder: Order = JSON.parse(JSON.stringify(order));
            nextOrder.workNo = order.workNo;
            that.setWorkTypeAndPrice(nextOrder, that.additionalWorkTypes[0], that.additionalPrices[0]);
            that.saveOrder(nextOrder, that.saveOrderSubscribeCallback);
            that.additionalWorkTypes.shift();
            that.additionalPrices.shift();          
        } else {
            setTimeout(() => {
                console.log('No more order to save, refreshing...');
                that.refresh();
                that.assignedEngineer = undefined;
            }, 500);

        }
    }

    public removeAssignment(order: Order, that: WoComponent): void {
        if (order.assignee && order.assignee.length > 0 && !order.assigneeFull) {
            order.assigneeFull = that.toolsService.getEngineers(order.assignee, that.engineers)
        }

        if (order.assigneeFull && order.assigneeFull.length > 0) {

            let user: User = order.assigneeFull.shift();
            console.log('About to clean assignment for '+order.statusCode+' assignments: '+order.assigneeFull.length+' userId: '+user.id+'...');

            that.userService.deleteRelation(user, order).subscribe(result => that.removeAssignment(order, that));
        }

    }

    //this can differ when creating many orders in one dialog
    private setWorkTypeAndPrice(order: Order, workType: CodeValue, price: CodeValue): void {
        order.typeCode = workType.code;
        order.price = (price != undefined && price.code !== undefined) ? <number> +price.code : this.toolsService.parsePrice(JSON.stringify(price), order.workNo);
        console.log('price ' + order.price);
    }

    private isRelatedItemChanged(relatedItem:RelatedItem):boolean {
        //console.log('isRelatedItemChanged');
        let originalItem:RelatedItem = this.getOriginalRelatedItemById(relatedItem.id);

        if (JSON.stringify(originalItem) === JSON.stringify(relatedItem)) {
            return false;
        }
        console.log('isRelatedItemChanged differs: original=' + JSON.stringify(originalItem) + '\n changed=' + JSON.stringify(relatedItem));
        return true;
    }

    private refreshItems(newItem: RelatedItem, addIfNotFound: boolean): void {
        // idea to use to assure stopping adding/updating items after first in type loop
        for (let i = 0; i < this.relatedItems.length; i++) {
            if (this.relatedItems[i].id === newItem.id) {
                this.relatedItems[i] = newItem;
                // idea to use to assure stopping adding/updating items after first in type loop
                this.relatedItem = JSON.parse(JSON.stringify(newItem));
                return;
            }
        }
        if (addIfNotFound) {
            this.relatedItems.push(newItem);
            // idea to use to assure stopping adding/updating items after first in type loop
            this.relatedItem = JSON.parse(JSON.stringify(newItem));
        }
    }


    private getOriginalRelatedItemById(id:number):RelatedItem {
        for (let item of this.relatedItems) {
            if (item.id === id) {
                return JSON.parse(JSON.stringify(item));
            }
        }
        return null;
    }

    private getOriginalRelatedItemByNumber(itemNo:string):RelatedItem {
        for (let item of this.relatedItems) {
            if (item.itemNo === itemNo) {
                return JSON.parse(JSON.stringify(item));
            }
        }
        return null;
    }


    private sortRelatedItems(relatedItems:RelatedItem[]):void {
        this.relatedItems = relatedItems.sort(function (a,b) {
            return ((a.itemNo) >= (b.itemNo)) ? 1 : -1;
        });
    }
}




