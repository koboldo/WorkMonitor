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
        return this.http.post('/api/v1/timesheets', timesheet).map((response: Response) => response.json().timesheet);
    }

    upsertAttendanceFrom(personId: number): Observable<any> {
        let from = {
            personId: personId,
            from: "now"
        };
        console.log("upserting "+JSON.stringify(from));
        return this.http.post('/api/v1/timesheets', from).map((response: Response) => response.json());
    }

    upsertAttendanceTo(personId: number): Observable<any> {
        let to = {
            personId: personId,
            to: "now"
        };
        console.log("upserting "+JSON.stringify(to));
        return this.http.post('/api/v1/timesheets', to).map((response: Response) => response.json());
    }

    addLeave(personId: number, from: string, to: string): Observable<any> {
        let leave = {
            personId: personId,
            from: from,
            to: to
        };

        console.log("adding Leave "+JSON.stringify(leave));
        return this.http.post('/api/v1/timesheets/leave', leave).map((response: Response) => response.json());
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