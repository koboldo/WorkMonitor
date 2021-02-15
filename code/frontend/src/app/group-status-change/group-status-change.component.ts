import { Component, OnInit, Input, Output, EventEmitter, Inject, forwardRef } from '@angular/core';
import { ToolsService, WOService, DictService, AlertService, WorkTypeService } from '../_services';
import { Order, CodeValue, commentAdd, Comments, User } from '../_models';
import { WoComponent } from '../wo/wo.component';

@Component({
    selector: 'app-group-status-change',
    templateUrl: './group-status-change.component.html',
    styleUrls: ['./group-status-change.component.css']
})
export class GroupStatusChangeComponent implements OnInit {

    ordersToChange:Order [];
    copyOrdersToChange:Order [] = [];
    selectedOrders:Order [];
    ordersNotChange:Order [] = [];
    ordersChanged:Order [] = [];

    /* autocompletion statuses */
    statuses:CodeValue[] = [];
    suggestedStatuses:CodeValue[];
    status:CodeValue;

    newComment:string;
    cols: any;

    constructor(private toolsService:ToolsService,
                private woService:WOService,
                private alertService:AlertService,
                private dictService:DictService,
                private workTypeService: WorkTypeService) {
    }

    ngOnInit() {
        this.statuses = this.dictService.getWorkStatuses();
        this.cols = [
            { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-35", check: true},
            { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"width-50 text-center"}, 
            { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-100"},
            { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-100"},
            { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-135"},
            { field: 'complexity', header: 'Wycena' , sortable:true, filter:false,class:"width-50 text-center"},
            { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-100" },
            { field: 'price', header: 'Cena', sortable:true, filter:true,class:"width-70 text-right", price:true },     
            { field: 'assignee', header: 'Wykonawca', sortable:true, filter:true, class:"width-100" },
            { field: 'protocolNo', header: 'Protokół', sortable:true, filter:true, class:"width-70" },
            { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-125"},
            { field: 'creationDate', header: 'Utw.', sortable:true , filter:true, class:"width-125"},
            { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-100"},
            { field: 'ventureDisplay', header: 'Zleceniodawca', sortable:true , filter:true, class:"width-135" },
            // hidden columns
            { field: 'complexityCode', header: 'Zł.', hidden:true, sortable:true, filter:false,complexity:true, icon:true,class:"width-50 text-center" },
            { field: 'isFromPool', header: 'Pula' , hidden:true, sortable:true, filter:true, isFromPool:true, icon:true, class:"width-35 text-center"},
            { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
            { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
            { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
            { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
            { field: 'ventureCompany', header: 'Inwestor', hidden:true, sortable:true , filter:true, class:"width-100"},
            { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
            { field: 'sComments', header: 'Komentarz', hidden:true, sortable:true , filter:true},
            { field: 'description', header: 'Opis', hidden:true, filter:true },
          ]
    }

    @Input()
    parent: WoComponent;  //this is null for

    @Input()
    operator: User;

    @Input()
    operatorMode: boolean;

    @Input()
    set listToDisplay(orders:Order[]) {
        if (orders) {
            this.ordersToChange = orders.filter(order => order.statusCode !== 'CL');
            this.copyOrdersToChange = this.ordersToChange;
        }

    }

    @Output()
    closeModalEvent = new EventEmitter<boolean>();

    onCloseModal() {
        console.log('onCloseModal exec');
        this.closeModalEvent.emit(false);
    }


    filter(event) {
        this.selectedOrders = [];
        this.ordersToChange = [];
        this.copyOrdersToChange.forEach(order => {
            if (this.toolsService.isStatusAllowed(order, this.status.code) && order.statusCode !== this.status.code) {
                this.ordersToChange.push(order);
            }
        });
    }

    suggestStatus(event) {
        let suggestedStatuses:CodeValue[] = [];
        let queryIgnoreCase:string = event.query ? event.query.toLowerCase() : event.query;
        if (this.statuses && this.statuses.length > 0) {
            for (let status of this.statuses) {
                if (status.paramChar.toLowerCase().indexOf(queryIgnoreCase) > -1)
                    suggestedStatuses.push(status);
            }
        }
        this.suggestedStatuses = suggestedStatuses;
        console.log('suggestedStatuses: ' + JSON.stringify(this.suggestedStatuses));
    }

    addCommment(order:Order):void {
        if (this.newComment && this.newComment.length > 0) {
            if (!order.comments) {
                order.comments = new Comments(null);
            }
            let reason:string = this.getReason(this.status.code);
            commentAdd(order.comments, reason, this.operator, this.newComment);
        }
        console.log(order.comments);
    }

    public closeOrders() {
        this.status = this.getStatus('CO');
        this.changeOrdersStatus(true);
    }

    public changeOrdersStatus(first: boolean) {

        if (!this.selectedOrders || this.selectedOrders.length < 1 || !this.status || !this.status.code) {

            if (first) {
                this.alertService.warn('Nie wybrano statusu lub zleceń do modyfikacji!');
            } else {
                if (this.ordersChanged.length > 0) {
                    this.operatorMode ? this.alertService.success('Pomyślnie zmieniono status zleceń ' + this.toPrintableString(this.ordersChanged)) : this.alertService.success('Pomyślnie zakończono zlecenia ' + this.toPrintableString(this.ordersChanged));
                }
                if (this.ordersNotChange.length > 0) {
                    this.operatorMode ? this.alertService.success('Nie zmieniono statusu zleceń ' + this.toPrintableString(this.ordersNotChange)) : this.alertService.success('Nie zakończono zleceń ' + this.toPrintableString(this.ordersNotChange));
                }
            }

            this.status = null;
            this.newComment = null;
            this.selectedOrders = [];
            this.ordersToChange = [];
            this.copyOrdersToChange = [];
            this.ordersNotChange = [];
            this.ordersChanged = [];
            this.onCloseModal();

        } else {

            let order:Order = this.selectedOrders.shift();

            console.log('Changing order '+JSON.stringify(order)+ ' to status ' + JSON.stringify(this.status));

            if (this.toolsService.isStatusAllowed(order, this.status.code)) {
                order.statusCode = this.status.code;
                if (this.newComment != null) {
                    this.addCommment(order);
                }
                if (order.statusCode === 'OP') { //we will never reach this code on non-operator mode but this is risky
                    this.parent.removeAssignment(order, this.parent);
                }

                this.woService.updateOrder(order).subscribe(
                    succes => {
                        this.ordersChanged.push(order);
                        this.changeOrdersStatus(false);
                    },
                    err => {
                        this.noteOrderNotChange(order, true);
                        this.changeOrdersStatus(false);
                    }
                );

            } else {
                this.noteOrderNotChange(order, false)
            }

        }

    }

    private getReason (statusCode: string): string {
        let reson: string;
        switch (statusCode) {
            case 'SU':
                reson = 'Zawieszone';
                break;
            case 'CA':
                reson = 'Anulowane';
                break;
            case 'TR':
                 reson = 'Przeniesione do kosza';
                 break;
            default:
                reson = 'Edycja'
                break;
        }
        return reson;
    }

    private getStatus(statusCode: string): CodeValue {
        for (let status of this.statuses) {
            if (status.code === statusCode)
                return status;
        }
        return null;
    }

    private toPrintableString(orders: Order[]): string {
        let result: string = '';
        for (let order of orders) {
            result += order.workNo+' T('+order.typeCode+'), ';
        }
        return result;
    }

    private noteOrderNotChange(order:Order, isBackedError:boolean) {
        this.ordersNotChange.push(order);
        if (isBackedError) {
            console.log('Backend error for '+JSON.stringify(order));
            this.alertService.error('Nie udało zmienić się statusu zlecenia ' + order.workNo + ' Błąd aplikacji')
        } else {
            console.log('unauthorized status change for '+JSON.stringify(order));
            this.alertService.error('nie udalo sie zmienić statusu zlecenia ' + order.workNo + ' ze wzgledu na niedozwolone przejście z ' + order.status + ' do ' + this.status.paramChar);
        }

    }

}
