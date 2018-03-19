import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order, OrderHistory, User, WorkType } from '../_models/index';
import { Comments, commentToDbContent } from '../_models/comment';
import { HttpInterceptor } from '../_services/httpInterceptor.service';
import { DictService } from '../_services/dict.service';
import { WorkTypeService } from '../_services/workType.service';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class WOService {

    constructor(private http: HttpInterceptor, private dictService: DictService, private workTypeService: WorkTypeService) {
        console.log("WOService created");
        this.dictService.init();
        this.workTypeService.init();
    }

    /* ambigous since 12.2017
    getOrdersByWorkNo(workNo: string):Observable<Order> {

        return this.http.get('/api/v1/orders/external/'+workNo)
            .map((response: Response) => this.getWorkOrder(<Order> response.json()))
    }
    */

    getOrdersByStatus(status: string):Observable<Order[]> {

        return this.http.get('/api/v1/orders?status='+status)
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    getOrdersByDates(lastModAfter: string, lastModBefore: string) : Observable<Order[]> {

        return this.http.get('/api/v1/orders?lastModAfter='+lastModAfter+"&lastModBefore="+lastModBefore)
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    getAssignedOrders(personId: number) : Observable<Order[]> {

        return this.http.get('/api/v1/orders?personId='+personId+"&status=AS")
            .map((response: Response) => this.getWorkOrders(response.json()))
    }

    updateOrder(order: Order) : Observable<Order> {
        return this.http.put('/api/v1/orders/'+order.id, JSON.stringify(this.getStrippedOrder(order)))
            .map((response: Response) => response.json().updated)
            .mergeMap(updatedId => this.getOrderById(order.id));
    }

    getOrderById(id:number):Observable<Order> {
        return this.http.get('/api/v1/orders/'+id)
            .map((response: Response) => this.getWorkOrder(response.json()));
    }

    addOrder(order: Order) : Observable<Order> {
        return this.http.post('/api/v1/orders', JSON.stringify(this.getStrippedOrder(order)))
            .map((response: Response) => response.json().created)
            .mergeMap(createdId => this.getOrderById(createdId));
    }

    getOrderHistoryById(id:number):Observable<OrderHistory[]> {
        return this.http.get('/api/v1/orders/history/' + id)
            .map((response:Response) => this.getWorkOrders(response.json()));
    }

    getRelatedItem(id: number): Observable<any> {
        return this.http.get('/api/v1/relatedItems/' + id)
            .map((response:Response) => this.getItem(response.json()));
    }

    prepareProtocol(ids: number[]) : Observable<any> {

        let flatIds: string = "";

        for(let id of ids) {
            flatIds += id+",";
        }
        if (flatIds.length > 1) {
            flatIds = flatIds.substr(0, flatIds.length-1);
        }

        return this.http.get('/api/v1/report/protocol?ids='+flatIds)
            .map((response: Response) => this.getProtocol(response.json()))
    }

    fetchProtocol(protocolNo: string) : Observable<any> {
        return this.http.get('/api/v1/report/protocol?protocolNo='+protocolNo)
            .map((response: Response) => this.getProtocol(response.json()))
    }


    // private helper methods

    private getProtocol(json:any):any {
        console.log("protocol: "+JSON.stringify(json));
        return json;
    }

    private getStrippedOrder(order: Order): Order {
        let strippedOrder:Order = JSON.parse(JSON.stringify(order));
        // this is not from dict but strippedOrder.complexity = undefined;
        strippedOrder.status = undefined;
        strippedOrder.type = undefined;
        strippedOrder.lastModDate = undefined;
        strippedOrder.assignee = undefined;
        strippedOrder.isFromPool = undefined;

        strippedOrder.relatedItems = undefined;
        strippedOrder.itemNo = undefined;
        strippedOrder.itemDescription = undefined;
        strippedOrder.itemBuildingType = undefined;
        strippedOrder.itemConstructionCategory = undefined;
        strippedOrder.itemAddress = undefined;
        strippedOrder.itemCreationDate = undefined;

        if (strippedOrder.comments) {
            console.log("changing comments");
            strippedOrder.comment = commentToDbContent(strippedOrder.comments);
            strippedOrder.comments = undefined;
        }

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
            order.type = this.workTypeService.getWorkTypeDescription(order.typeCode);
        }

        if (order.officeCode) {
            order.office = this.dictService.getOffice(order.officeCode);
        }

        if (order.complexity && order.complexity > 0) {
            //console.log('Complexity read from backend: '+order.complexity);
        } else if (order.complexityCode && order.typeCode && order.officeCode) {
            let workType: WorkType = this.workTypeService.getWorkType(order.typeCode, order.officeCode, order.complexityCode);
            if (workType && workType.complexity) {
                console.log('Complexity read from workType parametrization: '+workType.complexity);
                order.complexity = workType.complexity;
            } else {
                order.complexity = -13;
            }
        }

        if (order.price === -13) {
            order.price = undefined;
        }

        if (order.comment) {
            //console.log("test order.comment: inside ");
            order.comments = new Comments(order.comment);
            order.sComments = JSON.stringify(order.comments);
        }

        // flat structure to enable filtering in p-datatable
        if (order.relatedItems && order.relatedItems[0] !== undefined) {
            order.itemNo = order.relatedItems[0].itemNo;
            order.itemDescription = order.relatedItems[0].description;
            order.itemBuildingType = order.relatedItems[0].mdBuildingType;
            order.itemConstructionCategory = order.relatedItems[0].mdConstructionCategory;
            order.itemAddress = order.relatedItems[0].address;
            order.itemCreationDate = order.relatedItems[0].creationDate;
        }

        return order;
    }

    private getItem(item:any):any {
        return item;
    }
}