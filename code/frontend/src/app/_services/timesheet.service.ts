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


    add(sheets: Timesheet[]): Observable<number> {
        console.log("Adding "+JSON.stringify(sheets));
        if (1 === 1) return new EmptyObservable();

        if (sheets.length > 0) {
            return this.http.post('/api/v1/timeSheets/', sheets).map((response: Response) => response.json());
        } else {
            return new EmptyObservable();
        }

    }

    update(sheets: Timesheet[]): Observable<number> {
        console.log("Updating "+JSON.stringify(sheets));
        if (1 === 1) return new EmptyObservable();

        if (sheets.length > 0) {
            return this.http.post('/api/v1/timeSheets/', sheets).map((response: Response) => response.json());
        } else {
            return new EmptyObservable();
        }
    }

    getByDates(workDateAfter: string, workDateBefore: string) : Observable<Timesheet[]> {
        return this.http.get('/api/v1/timeSheets?workDateAfter='+workDateAfter+"&workDateBefore="+workDateBefore)
            .map((response: Response) => this.getTimesheets(response.json()))
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