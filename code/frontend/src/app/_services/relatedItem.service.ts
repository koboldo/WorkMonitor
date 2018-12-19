
import {map} from 'rxjs/operators';
import { Injectable, Component, OnInit, ViewChild } from '@angular/core';

import { Observable }    from 'rxjs/Observable';



import { Order } from '../_models/order';
import { RelatedItem } from '../_models/relatedItem';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';


@Injectable()
export class RelatedItemService {

    constructor(private http: HttpBotWrapper) {
        console.log("RelatedItemService created");
    }

    getAllItems() : Observable<RelatedItem[]> {
        return this.http.get('/api/v1/relatedItems').pipe(
            map((response: Object) => response['list']));
    }

    updateItem(item: RelatedItem) : Observable<RelatedItem> {
        return this.http.put('/api/v1/relatedItems/'+item.id, JSON.stringify(item)).pipe(
            map((response: Object) => response['updated']))
            .mergeMap(updatedId => this.getItemById(item.id));
    }

    addItem(item: RelatedItem) : Observable<RelatedItem> {
        return this.http.post('/api/v1/relatedItems', JSON.stringify(item)).pipe(
            map((response: Object) => response['created']))
            .mergeMap(createdId => this.getItemById(createdId));
    }

    // private helper methods

    private getItemById(id:number):Observable<RelatedItem> {
        return this.http.get('/api/v1/relatedItems/'+id) as Observable<RelatedItem>;
    }
}