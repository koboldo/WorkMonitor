import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { WorkType } from '../_models/index';
import { HttpInterceptor } from '../_services/httpInterceptor.service';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class WorkTypeService {

    constructor(private http: HttpInterceptor) {
        console.log("RelatedItemService options");
    }

    getAllWorkTypes() : Observable<WorkType[]> {
        return this.http.get('/api/v1/workTypes')
            .map((response: Response) => response.json().list);
    }


    // private helper methods

}