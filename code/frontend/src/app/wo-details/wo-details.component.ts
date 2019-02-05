import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

@Component({
    selector: 'app-wo-details',
    templateUrl: './wo-details.component.html',
    styleUrls: ['./wo-details.component.css']
})
export class WoDetailsComponent implements OnInit {

    _selectedOrder: Order;
    staff: User[];
    ventureRepresentatives: User[];

    constructor(private toolsService: ToolsService,
                private woService: WOService,
                private userService:UserService,
                private workTypeService: WorkTypeService) {
    }

    ngOnInit() {
        this.userService.getAllStaff().subscribe(staff => this.staff = staff);
        this.userService.getVentureRepresentatives().subscribe(vr => this.ventureRepresentatives = vr);
    }

    @Input()
    set selectedOrder(order: Order) {
        if (order) {
            console.log('got order: ', order.id);
            this._selectedOrder = order;

            this.woService.getOrderHistoryById(order.id)
                .subscribe(history => this.processHistory(history));

        }
    }

    get selectedOrder(): Order {
        return this._selectedOrder;
    }

    private processHistory(history:OrderHistory[]):void {


        for (let record of history) {
            if (record.itemId !== undefined && record.itemId > 0) {
                this.woService.getRelatedItem(record.itemId).subscribe(item => record.itemNo = item.itemNo);
            }
            if (this.staff && this.staff.length > 0) {
                this.fillModifiedBy(record);
            }
            if (this.ventureRepresentatives && this.ventureRepresentatives.length > 0) {
                this.fillVentureRepresentative(record);
            }
        }

        this._selectedOrder.history = history;
    }

    private fillModifiedBy(record: OrderHistory): void {
        for(let s of this.staff) {
            if (s.id === record.modifiedBy) {
                record.modifiedByFull = s;
                return;
            }
        }
    }

    private fillVentureRepresentative(record:OrderHistory):void {
        for(let vr of this.ventureRepresentatives) {
            if(vr.id === record.ventureId) {
                record.ventureDisplay = vr.firstName+" "+vr.lastName;
                record.ventureCompany = vr.company;
            }
        }
    }

    public getColor() :string {
        return this.workTypeService.getWorkTypeColor(this._selectedOrder);//this.toolsService.getOrderColor(this._selectedOrder.typeCode);
    }

    public getStatusIcon(): string {
        return this.toolsService.getStatusIcon(this._selectedOrder.statusCode);
    }

}
