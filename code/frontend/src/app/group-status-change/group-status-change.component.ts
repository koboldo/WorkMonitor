import { Component, OnInit, Input, Output, EventEmitter, Inject, forwardRef } from '@angular/core';
import { ToolsService, WOService, DictService, AlertService } from '../_services';
import { Order, CodeValue, commentAdd, Comments, User } from '../_models';
import { WoComponent } from '../wo/wo.component';

@Component({
    selector: 'app-group-status-change',
    templateUrl: './group-status-change.component.html',
    styleUrls: ['./group-status-change.component.css']
})
export class GroupStatusChangeComponent implements OnInit {

    ordersToChange:Order [];
    selectedOrders:Order [];
    ordersNotChange:Order [] = [];
    copyOrdersToChange:Order [] = [];
    operator:User;

    /* autocompletion statuses */
    statuses:CodeValue[] = [];
    suggestedStatuses:CodeValue[];
    status:CodeValue;

    editedOrder:Order;
    newComment:string;
    showModal:boolean;

    constructor(private toolsService:ToolsService,
                private woService:WOService,
                private alertService:AlertService,
                private dictService:DictService) {
    }

    ngOnInit() {
        this.statuses = this.dictService.getWorkStatuses();
    }

    @Input()
    parent:WoComponent;

    @Input()
    set ListToDisplay(orders:Order[]) {
        this.ordersToChange = orders;
        this.copyOrdersToChange=orders;
    }

    get ListToDisplay():Order[] {
        return this.ordersToChange;
    }

    @Input ()
    set Operator(operator:User) {
        this.operator = operator;
    }

    get Operator():User {
        return this.operator;
    }

    @Output() closeModalEvent = new EventEmitter<boolean>();

    onCloseModal() {
        this.closeModalEvent.emit(false);
    }

    filter(event) {
        let filteredOrders:Order[]=[];
        this.copyOrdersToChange.forEach(element => {
            if (this.toolsService.isStatusAllowed(element, this.status.code)) {
                filteredOrders.push(element);
            }
        });
        this.ordersToChange=filteredOrders;
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
            let reason:string = (this.status.code === 'SU' || this.status.code === 'CA') ? "Anulowanie" : "Edycja";
            commentAdd(order.comments, reason, this.operator, this.newComment);
        }
        console.log(order.comments);
    }

    public changeStatus() {
        if ((this.operator.roleCode.indexOf('OP') == -1))
        {
            for (let status of this.statuses) {
                    if (status.code === "CO")
                    this.status=status
            }
        }
        if (!this.selectedOrders || this.selectedOrders.length < 1) {

            this.newComment = null;
            this.selectedOrders = null;
            this.onCloseModal();

        } else if (this.status && this.status.code) {

            let order:Order = this.selectedOrders.shift();

            if (this.toolsService.isStatusAllowed(order, this.status.code)) {
                order.statusCode = this.status.code;
                if (this.newComment != null) {
                    this.addCommment(order);
                }
                if (order.statusCode === 'OP') {
                    this.parent.removeAssignment(order, this.parent);
                }

                this.woService.updateOrder(order).subscribe(
                    succes => {
                        this.operator.roleCode.indexOf('OP') == -1 ? this.alertService.success('Pomyślnie zakończono zlecenie ' + order.workNo) :this.alertService.info('Pomyślnie zmieniono status zlecenia ' + order.workNo) ;
                        this.changeStatus();
                    },
                    err => {
                        this.noteOrderNotChange(order, true);
                        this.changeStatus();
                    }
                );

            } else {
                this.noteOrderNotChange(order, false)
            }

        }

    }

    noteOrderNotChange(order:Order, isBackedError:boolean) {
        this.ordersNotChange.push(order);
        if (isBackedError) {
            this.alertService.error('Nie udało zmienić się statusu zlecenia ' + order.workNo + " Błąd aplikacji")
        } else {
            this.alertService.error('nie udalo sie zmienić statusu zlecenia ' + order.workNo + ' ze wzgledu na niedozwolone przejście z ' + order.status + ' do ' + this.status.paramChar);
        }

    }

}
