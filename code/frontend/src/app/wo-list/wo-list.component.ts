import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

@Component({
    selector: 'app-wo-list',
    templateUrl: './wo-list.component.html',
    styleUrls: ['./wo-list.component.css']
})
export class WoListComponent implements OnInit {

    list:Order[];
    
    constructor(private toolsService: ToolsService,
                private woService: WOService,
                private userService:UserService) {
    }
    ngOnInit() {
        
    }
    @Input()
    set ListToDisplay(orders: Order[]) {
            this.list = orders;        
    }
    get ListToDisplay(): Order[] {
        return this.list;
    }
}
