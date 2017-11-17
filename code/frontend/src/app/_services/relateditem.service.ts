import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { RelatedItem } from '../_models/relatedItem';
import { AuthenticationService } from '../_services/authentication.service';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class RelatedItemService {

    constructor(private http: Http, private authService: AuthenticationService) {
        console.log("RelatedItemService options: " + JSON.stringify(this.authService.getAuthOptions()));
    }

    getAllItems() : Observable<RelatedItem[]> {
        return this.http.get('/api/v1/relatedItems', this.authService.getAuthOptions())
            .map((response: Response) => response.json().list);
    }


    // private helper methods

}