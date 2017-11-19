import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { User } from '../_models/user';
import { AuthenticationService } from '../_services/authentication.service';
import { DictService } from '../_services/dict.service';
import 'rxjs/add/operator/mergeMap';

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

    getAssignedOrders(personId: number) : Observable<Order[]> {

        return this.http.get('/api/v1/orders?personId='+personId+"&status=AS", this.authService.getAuthOptions())
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    updateOrder(order: Order) : Observable<Order> {
        return this.http.put('/api/v1/orders/'+order.id, JSON.stringify(this.getStrippedOrder(order)), this.authService.getAuthOptions())
            .map((response: Response) => response.json().updated)
            .mergeMap(updatedId => this.getOrderById(order.id));
    }

    private getOrderById(id:number):Observable<Order> {
        return this.http.get('/api/v1/orders/'+id, this.authService.getAuthOptions())
            .map((response: Response) => this.getWorkOrder(response.json()));
    }

    addOrder(order: Order) : Observable<Order> {
        return this.http.post('/api/v1/orders', JSON.stringify(this.getStrippedOrder(order)), this.authService.getAuthOptions())
            .map((response: Response) => response.json().created)
            .mergeMap(createdId => this.getOrderById(createdId));
    }

    // private helper methods

    private getStrippedOrder(order: Order): Order {
        let strippedOrder:Order = JSON.parse(JSON.stringify(order));
        strippedOrder.complexity = undefined;
        strippedOrder.status = undefined;
        strippedOrder.type = undefined;
        strippedOrder.lastModDate = undefined;
        strippedOrder.assignee = undefined;

        strippedOrder.relatedItems = undefined;
        strippedOrder.itemNo = undefined;
        strippedOrder.itemDescription = undefined;
        strippedOrder.itemBuildingType = undefined;
        strippedOrder.itemConstructionCategory = undefined;
        strippedOrder.itemAddress = undefined;
        strippedOrder.itemCreationDate = undefined;

        return strippedOrder;
    }

    private getWorkOrders(response:any):Order[] {
        let orders : Order[] = [];

        if (response.list && response.list.length > 0) {
            for (let order of response.list) {

                order = this.getWorkOrder(order);

                orders.push(order);
            }
        }

        return orders;
    }

    private getWorkOrder(order:Order):Order {
        if (order.statusCode) {
            console.log("trying for "+order.statusCode +" from "+JSON.stringify( this.dictService.getWorkStatus(order.statusCode) ) );
            order.status = this.dictService.getWorkStatus(order.statusCode);
        }

        if (order.typeCode) {
            order.type = this.dictService.getWorkType(order.typeCode);
        }

        if (order.complexityCode) {
            order.complexity = this.dictService.getComplexities(order.complexityCode)
        }

        // flat structure to enable filtering in p-datatable
        if (order.relatedItems[0] !== undefined) {
            order.itemNo = order.relatedItems[0].itemNo;
            order.itemDescription = order.relatedItems[0].description;
            order.itemBuildingType = order.relatedItems[0].mdBuildingType;
            order.itemConstructionCategory = order.relatedItems[0].mdConstructionCategory;
            order.itemAddress = order.relatedItems[0].address;
            order.itemCreationDate = order.relatedItems[0].creationDate;
        }

        return order;
    }
}