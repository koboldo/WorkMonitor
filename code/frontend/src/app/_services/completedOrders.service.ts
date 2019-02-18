import { Injectable } from '@angular/core';
import { Observable, AsyncSubject, Subject } from "rxjs";

import { User, CodeValue, UserPayroll, Order } from '../_models/index';
import { ToolsService } from '../_services/tools.service';
import { WOService } from '../_services/wo.service';

@Injectable({
    providedIn: 'root'
})

export class CompletedOrderService {

    completedOrders: Order[] = [];
    displayCompletedOrdersDialog: boolean;

    constructor(private woService: WOService,
                private toolsService: ToolsService) { }


    public showOrders(periodDate: string, completedWo: string): void {

        let orderIds: number[] = [];
        let completedOrders: string[] = completedWo ? completedWo.split("|") : [];
        for(let completedOrder of completedOrders) {
            let id: number = +completedOrder.split(":")[0];
            if (orderIds.indexOf(id) === -1) {
                orderIds.push(id);
            }
        }

        this.showOrdersByIds(periodDate, orderIds);
    }


    public showOrdersByIds(periodDate: string, orderIds: number[]) {
        console.log('ids: '+orderIds.length);

        if (orderIds && orderIds.length > 0) {

            const desc: string = 'Zrealizowano w '+this.toolsService.formatDate(this.toolsService.parseDate(periodDate+' 00:00:01'), 'yyyy-MM');
            this.woService.getOrderByIds(orderIds)
                .subscribe(orders => {
                    for(let order of orders) {
                        order.frontProcessingDesc = desc;
                    }
                    this.completedOrders = orders;
                    this.displayCompletedOrdersDialog = true;
                }
            );

        } else {
            this.completedOrders = [];
            this.displayCompletedOrdersDialog = true;
        }
    }


}