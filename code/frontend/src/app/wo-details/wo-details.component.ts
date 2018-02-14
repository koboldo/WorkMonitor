import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

@Component({
    selector: 'app-wo-details',
    templateUrl: './wo-details.component.html',
    styleUrls: ['./wo-details.component.css']
})
export class WoDetailsComponent implements OnInit {

    constructor(private toolsService: ToolsService,
                private woService: WOService) {
    }

    ngOnInit() {
    }

    @Input()
    set selectedOrder(order: Order) {
        if (order) {
            console.log('got order: ', order.id);
            this._selectedOrder = order;

            this.woService.getOrderHistoryById(order.id)
                .subscribe(history => this._selectedOrder.history = history);

        }
    }

    get selectedOrder(): Order {
        return this._selectedOrder;
    }

    _selectedOrder: Order;

    public getColor() :string {
        return this.toolsService.getOrderColor(this._selectedOrder.typeCode);
    }

    public getStatusIcon(): string {
        return this.toolsService.getStatusIcon(this._selectedOrder.statusCode);
    }

}
