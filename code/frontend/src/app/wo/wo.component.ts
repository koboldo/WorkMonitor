import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue, SearchUser } from '../_models/index';
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

    /* edit */
    editedOrder:Order;
    newOrder:boolean;
    isNewOrderOwner:boolean;
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
            {label: 'Przypisz/Zmień wykonawce', icon: 'fa-user', command: (event) => this.assign(true)},
            {label: 'Dopisz wykonawce', icon: 'fa-share', command: (event) => this.assign(false)},
            {label: 'Edycja zlecenia', icon: 'fa-pencil-square-o', command: (event) => this.edit()},
            {label: 'Dodaj nowe zlecenie', icon: 'fa-plus', command: (event) => this.add()}
        ];
        this.relatedItem = <RelatedItem>{};
    }

    ngOnInit() {
        this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);
        this.userService.getVentureRepresentatives().subscribe(ventureRepresentatives => this.ventureRepresentatives = ventureRepresentatives);
        this.itemService.getAllItems().subscribe(relatedItems => this.relatedItems = relatedItems);
        this.workService.getAllWorkTypes().subscribe(workTypesDetails => this.workTypesDetails = workTypesDetails);
        this.authSerice.userAsObs.subscribe(user => this.operator = user);

        this.workTypes = this.dictService.getWorkTypes();
        this.statuses = this.dictService.getWorkStatuses();

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
        this.orders = orders;
        return this.userService.getVentureRepresentatives();
    }

    private mapVentureRepresentative(orders: Order[], vrs:User[]):void {
        for(let order of orders) {
            for(let vr of vrs) {
                if (order.ventureId === vr.id) {
                    order.ventureDisplay = vr.firstName+" "+vr.lastName;
                    order.ventureCompany = vr.company;
                    order.ventureFull = vr;
                }
            }
        }
    }

    copyRelatedItem(value: any) {
        console.log("copyRelatedItem " + JSON.stringify(this.relatedItem));
        if (typeof this.relatedItem == 'string' || this.relatedItem instanceof String) {
            console.log("copyRelatedItem skipping due to string");
        } else {
            this.relatedItemCopy = JSON.parse(JSON.stringify(this.relatedItem));
        }
    }

    updateRelatedItem(value: any) {
        //this is tricky sometimes object sometimes string
        console.log("updateRelatedItem " + JSON.stringify(this.relatedItem)+"\nJSON "+JSON.stringify(value));
        if (this.relatedItem !== undefined) {
            if (typeof value == 'string' || value instanceof String) {
                if (this.relatedItemCopy !== undefined) {
                    this.relatedItem = this.relatedItemCopy;
                } else {
                    this.relatedItem = <RelatedItem> {};
                }
                this.relatedItem.itemNo = ""+value;
                this.copyRelatedItem(undefined);
            }
        }
    }

    suggestPrice(event) {
        console.log("all " + JSON.stringify(this.workTypesDetails));

        this.suggestedPrice = <CodeValue[]> [];
        if (this.workTypesDetails && this.workTypesDetails.length > 0) {
            for (let workTypeDetails of this.workTypesDetails) {
                let sPrice:string = <string> "" + workTypeDetails.price;
                if (sPrice.indexOf(event.query) > -1 && (workTypeDetails.typeCode === this.workType.code || this.workType.code === undefined) && workTypeDetails.officeCode === this.operator.officeCode && workTypeDetails.complexityCode === 'STD') {
                    this.suggestedPrice.push(new CodeValue(sPrice, sPrice + " PLN (" + this.workType.paramChar + " realizacja " + this.dictService.getOffice(workTypeDetails.officeCode) + ")"));
                }
            }
        }
        console.log("suggestedWorkTypeDetails: " + JSON.stringify(this.suggestedPrice));
    }

    suggestRelatedItem(event) {
        console.log("all " + JSON.stringify(this.relatedItems));

        this.suggestedRelatedItems = [];
        if (this.relatedItems && this.relatedItems.length > 0) {
            for (let item of this.relatedItems) {
                if (item.itemNo.indexOf(event.query) > -1) {
                    this.suggestedRelatedItems.push(item);
                }
            }
        }
        console.log("suggestedRelatedItems: " + JSON.stringify(this.suggestedRelatedItems));
    }

    suggestStatus(event) {
        this.suggestedStatuses = [];
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.indexOf(event.query) > -1) {
                    this.suggestedStatuses.push(status);
                }
            }
        }
        console.log("suggestedStatuses: " + JSON.stringify(this.suggestedStatuses));
    }

    suggestType(event) {
        this.suggestedTypes = [];
        if (this.workTypes && this.workTypes.length > 0) {
            for (let workType of this.workTypes) {
                if (workType.paramChar.indexOf(event.query) > -1) {
                    this.suggestedTypes.push(workType);
                }
            }
        }
        console.log("suggestedTypes: " + JSON.stringify(this.suggestedTypes));
    }

    suggestEngineer(event) {
        this.suggestedEngineers = [];
        if (this.engineers && this.engineers.length > 0) {
            for (let engineer of this.engineers) {
                let suggestion:string = JSON.stringify(engineer);
                console.log("suggestEngineer " + suggestion + " for " + JSON.stringify(event));
                if (suggestion.indexOf(event.query) > -1 && (this.editedOrder.assignee === undefined || this.editedOrder.assignee.indexOf(engineer.email) === -1)) {
                    let displayName:string = engineer.firstName + " " + engineer.lastName + " (" + engineer.role + ")";
                    this.suggestedEngineers.push(new SearchUser(displayName, engineer));
                }
            }
        }
        console.log("suggestedEngineers " + JSON.stringify(this.suggestedEngineers));
    }

    suggestVentureRepresentative(event) {
        this.suggestedVentureRepresentatives = [];
        if (this.ventureRepresentatives && this.ventureRepresentatives.length > 0) {
            for (let v of this.ventureRepresentatives) {
                let suggestion:string = JSON.stringify(v);
                console.log("suggestVentureRepresentative " + suggestion + " for " + JSON.stringify(event));
                if (suggestion.indexOf(event.query) > -1) {
                    let displayName:string = v.firstName + " " + v.lastName + " (" + v.company + ")";
                    this.suggestedVentureRepresentatives.push(new SearchUser(displayName, v));
                }
            }
        }
        console.log("suggestedVentureRepresentatives " + JSON.stringify(this.suggestedVentureRepresentatives));
    }


    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedOrder));
        this.selectedOrder.assigneeFull = this.toolsService.getEngineers(this.selectedOrder.assignee, this.engineers);
    }

    onRowDblclick(event) {
        console.log("onRowDblclick row!" + JSON.stringify(this.selectedOrder));
        this.edit();
    }

    assign(isNewOrderOwner:boolean):void {
        console.log("assigning!" + JSON.stringify(this.selectedOrder));
        if (isNewOrderOwner && this.selectedOrder.assignee !== undefined) {
            this.alertService.warn("Zmiana wykonawcy zlecenia " + this.selectedOrder.workNo + ", bieżący wykonawca/y" + this.selectedOrder.assignee);
        }
        if (isNewOrderOwner && this.selectedOrder.statusCode === "CO") {
            this.alertService.error("Nie można przypisac zlecenia w stanie " + this.selectedOrder.status);
        } else if (!isNewOrderOwner && this.selectedOrder.assignee === undefined) {
            this.alertService.error("Nie można DOPISAĆ do zlecenia gdyż nie ma jeszcze pierwszego wykonawcy!");
        } else {
            this.isNewOrderOwner = isNewOrderOwner;
            this.newOrder = false;
            this.editedOrder = this.selectedOrder;
            this.displayAssignDialog = true;
        }
    }


    add() {

        this.editedOrder = new Order(null, "OP", this.dictService.getWorkStatus("OP"), null, null, "STD", this.dictService.getComplexities("STD"), null, null, null, null);
        this.status = new CodeValue(this.editedOrder.statusCode, this.editedOrder.status);

        this.relatedItem = <RelatedItem> {};
        this.relatedItemCopy = <RelatedItem> {};

        this.price = <CodeValue> {};
        this.workType = <CodeValue> {};

        this.newOrder = true;
        this.displayEditDialog = true;
    }

    edit():void {

        console.log("editing!" + JSON.stringify(this.selectedOrder));

        //initial values based on selectedOrder for form preparation
        let price: string = this.selectedOrder.price !== undefined? ""+this.selectedOrder.price : "";
        this.price = new CodeValue(price, price);

        this.workType = new CodeValue(this.selectedOrder.typeCode, this.selectedOrder.type);
        this.status = new CodeValue(this.selectedOrder.statusCode, this.selectedOrder.status);
        this.relatedItem = (this.selectedOrder.relatedItems[0] === undefined ? <RelatedItem> {} : this.selectedOrder.relatedItems[0]);
        if (this.selectedOrder.ventureFull !== undefined && this.selectedOrder.ventureFull !== undefined) {
            this.assignedVentureRepresentative = new SearchUser(this.selectedOrder.ventureDisplay, this.selectedOrder.ventureFull);
        }

        this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
        this.newOrder = false;
        this.displayEditDialog = true;
    }



    saveAssignment() {
        console.log("saving assignment!" + JSON.stringify(this.editedOrder) + " for " + JSON.stringify(this.assignedEngineer.user));
        this.displayAssignDialog = false;
        this.userService.assignWorkOrder(this.assignedEngineer.user, this.editedOrder, this.isNewOrderOwner)
            .subscribe(json => this.updateOrderStatus(json.created, this.isNewOrderOwner, this.editedOrder, this.assignedEngineer.user));
    }


    private updateOrderStatus(created:number, isNewOrderOwner:boolean, order:Order, engineer:User):void {
        if (!created || created === -1) {
            console.log("Assignment problem! " + created);
            this.alertService.error("Blad przypisania zlecenia " + order.workNo + " do " + engineer.email);
            return;
        } else if (isNewOrderOwner && order.statusCode != "AS") { //update status
            console.log("Setting status to AS, current " + order.statusCode);
            order.statusCode = "AS";
        }
        this.alertService.info("Pomyślnie przypisano zlecenie " + order.workNo + " do " + engineer.email);

        this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder, false));
    }

    saveOrder() {

        this.editedOrder.statusCode = this.newOrder ? "OP" : this.status.code;
        this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);
        this.editedOrder.typeCode = this.workType.code;
        this.editedOrder.type = this.dictService.getWorkType(this.editedOrder.typeCode);
        this.editedOrder.ventureId = this.assignedVentureRepresentative && this.assignedVentureRepresentative.user && this.assignedVentureRepresentative.user.id ? this.assignedVentureRepresentative.user.id : undefined;

        this.editedOrder.price = (this.price != undefined && this.price.code !== undefined) ? <number> +this.price.code : this.toolsService.parsePrice(JSON.stringify(this.price), this.editedOrder.workNo);
        console.log("price " + this.editedOrder.price);

        //trying to optimize all actions newOrder-newRelatedItem(noId), changeOrder-newRelatedItem(noId), newOrder-changeRelatedItem(Id), changeOrder-changeRelatedItem(Id)
        if (this.relatedItem.itemNo !== undefined && this.relatedItem.id !== undefined) {
            if (this.isRelatedItemChanged(this.relatedItem)) {
                console.log("changing existing relatedItem itemNo:" + this.relatedItem.itemNo + ", id:" + this.relatedItem.id);
                this.itemService.updateItem(this.relatedItem).subscribe(item => this.storeOrder(item, this.editedOrder, this.newOrder, false));
            } else {
                console.log("no action on relatedItem but could be reassignment - this will be handled in storeOrder");
                this.storeOrder(this.relatedItem, this.editedOrder, this.newOrder, false);
            }
        } else if (this.relatedItem.itemNo !== undefined && this.relatedItem.id === undefined) {
            console.log("adding new relatedItem itemNo:" + this.relatedItem.itemNo + ", id:" + this.relatedItem.id);
            this.itemService.addItem(this.relatedItem).subscribe(item => this.storeOrder(item, this.editedOrder, this.newOrder, true));
        } else {
            console.log("no action on relatedItem itemNo:" + this.relatedItem.itemNo + ", id:" + this.relatedItem.id);
            this.storeOrder(this.relatedItem, this.editedOrder, this.newOrder, false);
        }

        this.displayEditDialog = false;
    }

    private storeOrder(item:RelatedItem, order:Order, newOrder:boolean, newItem:boolean):any {

        this.refreshItems(item, newItem);

        console.log("changing order related item to " + item.id);
        order.itemId = item.id;

        if (newOrder) {
            console.log("saving new!" + JSON.stringify(order));
            this.woService.addOrder(order).subscribe(createdOrder => this.refreshTable(createdOrder, this.newOrder))
        } else {
            console.log("changing!" + JSON.stringify(order));
            this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder, this.newOrder))
        }
    }

    private refreshTable(order:Order, newOrder:boolean) {
        console.log("Refreshing table with order " + JSON.stringify(order));

        if (newOrder && order && order.id > 0) {
            this.orders.push(order);
            this.orders = JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
            this.alertService.success("Pomyślnie dodano zlecenie " + order.workNo);
        } else if (!newOrder && order.id > 0) {
            let index:number = this.toolsService.findSelectedOrderIndex(order, this.orders);
            console.log("refresh index: " + index);
            this.orders[index] = order;
            this.orders = JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
            this.alertService.success("Pomyślnie zmieniono zlecenie " + order.workNo);
            return;
        } else {
            this.alertService.error("Nie można bylo odświeżyć tabeli wyników, szukaj jeszcze raz");
        }
    }



    private isRelatedItemChanged(relatedItem:RelatedItem):boolean {
        console.log("isRelatedItemChanged");
        let originalItem:RelatedItem = this.getOriginalRelatedItemById(relatedItem.id);

        if (JSON.stringify(originalItem) === JSON.stringify(relatedItem)) {
            return false;
        }
        console.log("differs: original=" + JSON.stringify(originalItem) + "\n changed=" + JSON.stringify(relatedItem));
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


    private refreshItems(item:RelatedItem, newItem: boolean):void {
        if (newItem) {
            this.relatedItems.push(item);
            if (item && item.itemNo) this.alertService.success("Pomyślnie dodano nowy obiekt: " + item.itemNo);
        } else {

            let index:number = 0;
            for (let anItem of this.relatedItems) {
                if (anItem.id === item.id) {
                    this.relatedItems[index] = item;
                    console.log("item " + JSON.stringify(item) + " has been refreshed!");
                    break;
                }
                index++;
            }
            this.search();
            if (item && item.itemNo) this.alertService.success("Pomyślnie zaktualizowano obiekt: " + item.itemNo);
        }
    }

}




