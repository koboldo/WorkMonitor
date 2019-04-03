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

    commentsCol: any;
    cols: any ;

    constructor(private toolsService: ToolsService,
                private woService: WOService,
                private userService:UserService,
                private workTypeService: WorkTypeService) {
    }

    ngOnInit() {
        this.userService.getAll().subscribe(staff => this.staff = staff);
        this.userService.getVentureRepresentatives().subscribe(vr => this.ventureRepresentatives = vr);
        this.cols = [
            { field: 'modifiedByFull.email', header:'Zmienił',  sortable: true, filter:true,class:"width-50 text-center", modifiedBy:true, icon:true},            
            { field: 'lastModDate', header: 'Zmieniono', sortable: true, filter:true,class:"width-50 text-center"},
            { field: 'versionDate', header: 'Nadpisano' , filter:true,sortable:true,  class:"width-50 text-center"},
            { field: 'workNo', header: 'Zlecenie', sortable:true, filter:true, class:"width-50 text-center"},
            { field: 'itemNo', header: 'Numer obiektu' ,filter: true,  class:"width-50 text-center"},
            { field: 'status', header: 'Status',sortable:true, filter:true,class:"width-35 text-center"},
            { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-20 text-center", isFromPool:true, icon:true},
            { field: 'complexity', header: 'Pracochłonność', sortable:true, filter:true, class:"width-35 text-center " },
            { field: 'price', header: 'Cena', sortable:true , filter:true, class:"width-35 text-center ", price:true, icon:true},
            { field: 'assigneeFull', header: 'Wykonawcy' , sortable:true, filter:true, class:"width-50 text-center ", assigneeFull:true, icon:true},          
            
          ]
        this.commentsCol = [
        { field: 'date', header:'Utworzono',  sortable: true, filter:true,class:"width-20 text-center"},            
        { field: 'sCreatedBy', header: 'Osoba', sortable: true, filter:true,class:"width-20 text-center"},
        { field: 'reason', header: 'Powód' , filter:true,sortable:true,  class:"width-20 text-center"},
        { field: 'text', header: 'Treść', sortable:true, filter:true, class:"width-80 text-center", text:true, icon:true}, 
        ]
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
                this.fillAssignedTo(record);
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


    private fillAssignedTo(record:OrderHistory):void {
        if (record.assignee && record.assignee.length > 0) {
            record.frontProcessingDesc = '';
            record.assigneeFull = [];
            for(let s of this.staff) {
                if (record.assignee.indexOf(''+s.id) > -1) {
                    record.assigneeFull.push(s);
                    record.frontProcessingDesc += ', '+(s.firstName ? s.firstName.substring(0, 1) : '') +'. '+s.lastName;
                }
            }
            if (record.frontProcessingDesc.indexOf(', ') > -1) {
                record.frontProcessingDesc = record.frontProcessingDesc.substring(2, record.frontProcessingDesc.length);
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
