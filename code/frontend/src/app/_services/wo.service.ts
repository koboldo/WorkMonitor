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


    getOrdersByLastMod() : Observable<Order[]> {



        //TODO form to check date
        return this.http.get('/api/v1/orders?lastModAfter=2017-07-10', this.authService.getAuthOptions())
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    // private helper methods

    private getWorkOrders(response:any):Order[] {
        let orders : Order[] = [];

        if (response.list && response.list.length > 0) {
            for (let order of response.list) {

                if (order.statusCode) {
                    console.log("trying for "+order.statusCode +" from "+JSON.stringify( this.dictService.getWorkStatus(order.statusCode) ) );
                    order.statusCode = this.dictService.getWorkStatus(order.statusCode);
                }
                orders.push(order);
            }
        }

        return orders;
    }
}