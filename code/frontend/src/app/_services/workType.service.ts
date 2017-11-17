import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { WorkType } from '../_models/index';
import { AuthenticationService } from '../_services/authentication.service';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class WorkTypeService {

    constructor(private http: Http, private authService: AuthenticationService) {
        console.log("RelatedItemService options: " + JSON.stringify(this.authService.getAuthOptions()));
    }

    getAllWorkTypes() : Observable<WorkType[]> {
        return this.http.get('/api/v1/workTypes', this.authService.getAuthOptions())
            .map((response: Response) => response.json().list);
    }


    // private helper methods

}