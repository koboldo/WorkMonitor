import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User, Order, Timesheet } from '../_models/index';
import { HttpInterceptor } from '../_services/httpInterceptor.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';

@Injectable()
export class TimesheetService {
    constructor(private http: HttpInterceptor, private dictService: DictService) {
        console.log("TimesheetService created");
    }



    getByDates(workDateAfter: string, workDateBefore: string) : Observable<Timesheet[]> {
        return this.http.get('/api/v1/timesheets?workDateAfter='+workDateAfter+"&workDateBefore="+workDateBefore)
            .map((response: Response) => this.getTimesheets(response.json()))
    }

    upsert(timesheet: Timesheet): Observable<Timesheet> {
        console.log("upserting "+JSON.stringify(timesheet));
        return this.http.put('/api/v1/timesheets', timesheet).map((response: Response) => response.json().timesheet);
    }


    private getTimesheets(response:any):any {
        let timesheets: Timesheet[] = [];

        if (response.list && response.list.length > 0) {
            for (let timesheet of response.list) {
                timesheets.push(timesheet);
            }
        }

        console.log("Got "+JSON.stringify(timesheets));
        return timesheets;
    }
}