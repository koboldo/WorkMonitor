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

    constructor() {
    }

    ngOnInit() {
    }

    @Input() selectedOrder: Order;



}
