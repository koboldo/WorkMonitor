import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { Comments, commentCancelOrHoldAsString, commentAdd } from '../_models/comment';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';


@Component({
    selector: 'app-wo-suspended',
    templateUrl: './wo-suspended.component.html',
    styleUrls: ['./wo-suspended.component.css']
})
export class WoSuspendedComponent {

}
