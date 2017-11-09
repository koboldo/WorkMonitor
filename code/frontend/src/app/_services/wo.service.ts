import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { User } from '../_models/user';
import { AuthenticationService } from '../_services/authentication.service';
import { DictService } from '../_services/dict.service';

@Injectable()
export class WOService {

    constructor(private http: Http, private authService: AuthenticationService, private dictService: DictService) {
        console.log("WOService options: " + JSON.stringify(this.authService.getAuthOptions()));
        this.dictService.init();
    }


    getOrdersByDates(lastModAfter: string, lastModBefore: string) : Observable<Order[]> {

        return this.http.get('/api/v1/orders?lastModAfter='+lastModAfter+"&lastModBefore="+lastModBefore, this.authService.getAuthOptions())
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    updateOrder(order: Order) : Observable<number> {
        return this.http.put('/api/v1/orders/'+order.id, JSON.stringify(this.getStrippedOrder(order)), this.authService.getAuthOptions())
            .map((response: Response) => response.json().updated)
    }

    addOrder(order: Order) : Observable<number> {
        return this.http.post('/api/v1/orders', JSON.stringify(this.getStrippedOrder(order)), this.authService.getAuthOptions())
            .map((response: Response) => response.json().created)
    }

    // private helper methods

    private getStrippedOrder(order: Order): Order {
        let strippedOrder:Order = JSON.parse(JSON.stringify(order));
        strippedOrder.complexity = undefined;
        strippedOrder.status = undefined;
        strippedOrder.type = undefined;
        strippedOrder.lastModDate = undefined;
        return strippedOrder;
    }

    private getWorkOrders(response:any):Order[] {
        let orders : Order[] = [];

        if (response.list && response.list.length > 0) {
            for (let order of response.list) {

                if (order.statusCode) {
                    console.log("trying for "+order.statusCode +" from "+JSON.stringify( this.dictService.getWorkStatus(order.statusCode) ) );
                    order.status = this.dictService.getWorkStatus(order.statusCode);
                }

                if (order.typeCode) {
                    order.type = this.dictService.getWorkType(order.typeCode);
                }

                if (order.complexityCode && order.complexityCode === "HDR") {
                    order.complexity = "fa-life-bouy";
                } else {
                    order.complexity = "fa-handshake-o";
                }

                orders.push(order);
            }
        }

        return orders;
    }
}