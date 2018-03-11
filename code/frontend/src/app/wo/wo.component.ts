import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue, SearchUser } from '../_models/index';
import { Comments, commentAsSimpleString, commentAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

import { MenuItem } from 'primeng/primeng';

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

    operator:User;

    constructor(private woService:WOService,
                private userService:UserService,
                private itemService:RelatedItemService,
                private workService:WorkTypeService,
                private dictService:DictService,
                private alertService:AlertService,
                private authSerice:AuthenticationService,
                private toolsService: ToolsService) {
        this.lastModAfter = toolsService.getCurrentDateDayOperation(-161); //TODO change
        this.lastModBefore = toolsService.getCurrentDateDayOperation(1);
        this.items = [
            {label: 'Przypisz/Zmień wykonawce', icon: 'fa-user', disabled: true, command: (event) => this.assign(true)},
            {label: 'Dopisz wykonawce', icon: 'fa-share', disabled: true, command: (event) => this.assign(false)},
            {label: 'Edycja zlecenia', icon: 'fa-pencil-square-o', disabled: true, command: (event) => this.edit()},
            {label: 'Dodaj nowe zlecenie', icon: 'fa-plus', disabled: true, command: (event) => this.add()}
        ];
        this.relatedItem = <RelatedItem>{};
    }

    ngOnInit() {
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(ventureRepresentatives => this.ventureRepresentatives = ventureRepresentatives);
        this.itemService.getAllItems().subscribe(relatedItems => this.relatedItems = relatedItems);
        this.workService.getAllWorkTypes().subscribe(workTypesDetails => this.workTypesDetails = workTypesDetails);
        this.authSerice.userAsObs.subscribe(user => this.assignOperator(user));

        this.workTypes = this.dictService.getWorkTypes();
        this.statuses = this.dictService.getWorkStatuses();

        this.search();
    }

    private assignOperator(operator:User):void {
        console.log('operator: '+JSON.stringify(operator));
        this.operator = operator;
        if (operator && operator.roleCode && operator.roleCode.indexOf('OP') > -1) {
            for(let item of this.items) {
                item.disabled = false;
            }
        }

    }

    refresh() {
        this.lastModBefore = this.toolsService.getCurrentDateDayOperation(1);
        this.search();
    }

    search() {
        this.woService.getOrdersByDates(
            this.lastModAfter.toISOString().substring(0, 10),
            this.lastModBefore.toISOString().substring(0, 10)
        )
        .mergeMap(orders => this.callVentures(orders))
        .subscribe(vrs => this.mapVentureRepresentative(this.orders, vrs));
    }

    private callVentures(orders: Order[]):Observable<User[]> {
        //this.orders = orders;
        //filter
        this.orders = [];
        for (let order of orders) {
            if (order.statusCode !== 'CA' && order.statusCode != 'SU') {
                this.orders.push(order);
            }
        }

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
                if (this.relatedItemCopy !== undefined) {
                    this.relatedItem = this.relatedItemCopy;
                } else {
                    this.relatedItem = <RelatedItem> {};
                }
                this.relatedItem.itemNo = ''+value;
                this.copyRelatedItem(undefined);
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
                    suggestedPrice.push(new CodeValue(sPrice, sPrice + ' PLN (cennik ' + this.dictService.getOffice(workTypeDetails.officeCode) + ')'));
                }
            }
        }
        this.suggestedPrice = suggestedPrice;
        console.log('suggestedWorkTypeDetails: ' + JSON.stringify(this.suggestedPrice));
    }

    suggestRelatedItem(event) {
        console.log('all ' + JSON.stringify(this.relatedItems));
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
        console.log('suggestedRelatedItems: ' + JSON.stringify(this.suggestedRelatedItems));
    }

    suggestStatus(event) {
        let suggestedStatuses: CodeValue[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1 && this.isStatusAllowed(this.editedOrder, status.code)) {
                    suggestedStatuses.push(status);
                }
            }
        }
        this.suggestedStatuses = suggestedStatuses;
        console.log('suggestedStatuses: ' + JSON.stringify(this.suggestedStatuses));
    }

    isStatusAllowed(order: Order, statusCode: string) {
        if (statusCode === 'IS' && this.toolsService.isReadyForProtocol(order)) {
            return true;
        } else if (order.assignee && order.assignee.length > 0) {
            return true;
        } else if (statusCode === 'OP' || statusCode === 'CL' || statusCode === 'SU') {
            return true;
        }
        return false;
    }



    suggestType(event) {
        let suggestedTypes:CodeValue[] = [];
        if (this.workTypes && this.workTypes.length > 0) {
            for (let workType of this.workTypes) {
                if (workType.paramChar.indexOf(event.query) > -1) {
                    suggestedTypes.push(workType);
                }
            }
        }
        this.suggestedTypes = suggestedTypes;
        console.log('suggestedTypes: ' + JSON.stringify(this.suggestedTypes));
    }

    suggestEngineer(event) {
        let suggestedEngineers:SearchUser[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.engineers && this.engineers.length > 0) {
            for (let engineer of this.engineers) {
                let suggestion:string = JSON.stringify(engineer).toLowerCase();
                console.log('suggestEngineer ' + suggestion + ' for ' + JSON.stringify(event));
                if (suggestion.indexOf(queryIgnoreCase) > -1 && (this.editedOrder.assignee === undefined || this.editedOrder.assignee.indexOf(engineer.email) === -1)) {
                    let displayName:string = engineer.firstName + ' ' + engineer.lastName + ' (' + engineer.role + ')';
                    suggestedEngineers.push(new SearchUser(displayName, engineer));
                }
            }
        }
        this.suggestedEngineers = suggestedEngineers;
        console.log('suggestedEngineers ' + JSON.stringify(this.suggestedEngineers));
    }

    suggestVentureRepresentative(event) {
        let suggestedVentureRepresentatives: SearchUser[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.ventureRepresentatives && this.ventureRepresentatives.length > 0) {
            for (let v of this.ventureRepresentatives) {
                let suggestion:string = JSON.stringify(v).toLowerCase();
                console.log('suggestVentureRepresentative ' + suggestion + ' for ' + JSON.stringify(event));
                if (suggestion.indexOf(queryIgnoreCase) > -1) {
                    let displayName:string = v.firstName + ' ' + v.lastName + ' (' + v.company + ' - '+v.office+')';
                    suggestedVentureRepresentatives.push(new SearchUser(displayName, v));
                }
            }
        }
        this.suggestedVentureRepresentatives = suggestedVentureRepresentatives;
        console.log('suggestedVentureRepresentatives ' + JSON.stringify(this.suggestedVentureRepresentatives));
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
        if (this.operator && this.operator.roleCode && this.operator.roleCode.indexOf('OP') > -1) {
            this.edit();
        }
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
    }

    edit():void {

        console.log('editing!' + JSON.stringify(this.selectedOrder));
        this.generateWorkNoFlag = 'N';
        this.comment = this.selectedOrder.comments ? commentAsString(this.selectedOrder.comments) : undefined;
        this.newComment = undefined;

        //initial values based on selectedOrder for form preparation
        let price: string = this.selectedOrder.price !== undefined? ''+this.selectedOrder.price : '';
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
    }



    saveAssignment() {
        console.log('saving assignment!' + JSON.stringify(this.editedOrder) + ' for ' + JSON.stringify(this.assignedEngineer.user));
        this.displayAssignDialog = false;
        this.userService.assignWorkOrder(this.assignedEngineer.user, this.editedOrder, this.isNewOrderOwner)
            .subscribe(json => this.updateOrderStatus(json.created, this.isNewOrderOwner, this.editedOrder, this.assignedEngineer.user));
    }


    private updateOrderStatus(created:number, isNewOrderOwner:boolean, order:Order, engineer:User):void {
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
        this.woService.updateOrder(order).subscribe(updatedOrder => this.refresh());
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

        order.statusCode = this.newOrder ? 'OP' : this.status.code;
        order.status = this.dictService.getWorkStatus(order.statusCode);

        if (this.newComment && this.newComment.length > 0) {
            let reason: string = (order.statusCode === 'SU' || order.statusCode === 'CA') ? "Anulowanie" : "Edycja";
            if (!order.comments) {
                order.comments = new Comments(null);
            }
            commentAdd(order.comments, reason, this.operator, this.newComment);
        }

        if (this.toolsService.isStatusLowerThanProtocol(order.statusCode)) {
            order.protocolNo = ''; //According to LE its null for sqlite
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
            this.alertService.error('WO nie zostało zapiasane, nieprawidlowy (pusty?) region zleceniodawcy!');
            return;
        }


        let workTypeParam: WorkType = this.workService.getWorkType(order.typeCode, order.officeCode, 'STD');
        if (workTypeParam && workTypeParam.complexity >= 0) {
            order.complexity = workTypeParam.complexity;
            order.type = this.dictService.getWorkType(order.typeCode);
        } else {
            console.log("workTypeParam = "+JSON.stringify(workTypeParam));
            this.alertService.error('WO nie zostało zapiasane, nieprawidlowa parametryzacja dla '+order.type+', '+order.officeCode+'!');
            return;
        }


        //trying to optimize all actions newOrder-newRelatedItem(noId), changeOrder-newRelatedItem(noId), newOrder-changeRelatedItem(Id), changeOrder-changeRelatedItem(Id)
        if (this.relatedItem.itemNo !== undefined && this.relatedItem.id !== undefined) {
            if (this.isRelatedItemChanged(this.relatedItem)) {
                console.log('changing existing relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
                this.itemService.updateItem(this.relatedItem).subscribe(item => this.storeOrder(item, order, this.newOrder, false).subscribe(order => saveOrderCallback(order, this)));
            } else {
                console.log('no action on relatedItem but could be reassignment - this will be handled in storeOrder');
                this.storeOrder(this.relatedItem, order, this.newOrder, false).subscribe(order => saveOrderCallback(order, this));
            }
        } else if (this.relatedItem.itemNo !== undefined && this.relatedItem.id === undefined) {
            console.log('adding new relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
            this.itemService.addItem(this.relatedItem).subscribe(item => this.storeOrder(item, order, this.newOrder, true).subscribe(order => saveOrderCallback(order, this)));
        } else {
            console.log('no action on relatedItem itemNo:' + this.relatedItem.itemNo + ', id:' + this.relatedItem.id);
            this.storeOrder(this.relatedItem, order, this.newOrder, false).subscribe(order => saveOrderCallback(order, this));
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
        if (that.additionalWorkTypes.length > 0 && that.additionalWorkTypes[0].code !== '') {
            console.log('Still work todo, up to '+that.additionalWorkTypes.length +", order.workNo: "+order.workNo);
            let nextOrder: Order = JSON.parse(JSON.stringify(order));
            nextOrder.workNo = order.workNo;
            that.setWorkTypeAndPrice(nextOrder, that.additionalWorkTypes[0], that.additionalPrices[0]);
            that.saveOrder(nextOrder, that.saveOrderSubscribeCallback);
            that.additionalWorkTypes.shift();
            that.additionalPrices.shift();
        } else {
            console.log('No more order to save, refreshing...');
            that.refresh();
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

    private getOriginalRelatedItemById(id:number):RelatedItem {
        for (let item of this.relatedItems) {
            if (item.id === id) {
                return item;
            }
        }
        return null;
    }


}




