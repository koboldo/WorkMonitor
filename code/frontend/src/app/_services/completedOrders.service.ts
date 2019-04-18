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

        let orderId2Magic: Map<number, string> = new Map();

        // magic completedWo string example -> "completedWo": "17228:420::0.5:::Y|18159:420::0.5:::Y",

        let completedOrders: string[] = completedWo ? completedWo.split("|") : [];
        for(let completedOrder of completedOrders) {

            let id: number = +completedOrder.split(":")[0];
            orderId2Magic.set(id, completedOrder);
        }

        this.showOrdersByIds(periodDate, orderId2Magic);
    }


    public showOrdersByIds(periodDate: string, orderId2Magic: Map<number, string>) {
        console.log('orderId2Magic: '+orderId2Magic.size);

        if (orderId2Magic && orderId2Magic.size > 0) {

            let orderIds: number[] = Array.from( orderId2Magic.keys() );

            const desc: string = 'Zr. w '+this.toolsService.formatDate(this.toolsService.parseDate(periodDate+' 00:00:01'), 'yyyy-MM');
            this.woService.getOrderByIds(orderIds)
                .subscribe(orders => {
                    for(let order of orders) {
                        order.frontProcessingDesc = desc;
                        order.poolRevenue = -1;
                        if (orderId2Magic.get(order.id) && orderId2Magic.get(order.id).indexOf(':') != -1) {
                          let magic: string[] = orderId2Magic.get(order.id).split(':');
                          if (magic.length > 3) {
                            let poolInclusionFactor: number = +magic[3];
                            order.poolRevenue = order.isFromPool == 'Y' ? order.price * poolInclusionFactor : 0;
                          }
                        }

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