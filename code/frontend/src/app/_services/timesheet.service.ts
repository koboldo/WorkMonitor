import { Injectable } from '@angular/core';

import { User, Order, Timesheet } from '../_models/index';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';


@Injectable()
export class TimesheetService {

    constructor(private http: HttpBotWrapper, private dictService: DictService) {
        console.log('TimesheetService created');
    }

    getByDates(workDateAfter: string, workDateBefore: string) : Observable<Timesheet[]> {
        return this.http.get('/api/v1/timesheets?workDateAfter='+workDateAfter+'&workDateBefore='+workDateBefore)
            .pipe(map((response: Object) => this.getTimesheets(response)));
    }

    getByIdAndDates(id: number, workDateAfter: string, workDateBefore: string) : Observable<Timesheet[]> {
        return this.http.get('/api/v1/timesheets?workDateAfter='+workDateAfter+'&workDateBefore='+workDateBefore+'&personId='+id)
            .pipe(map((response: Object) => this.getTimesheets(response)))
    }

    upsert(timesheet: Timesheet): Observable<Timesheet> {
        console.log('upserting '+JSON.stringify(timesheet));
        return this.http.post('/api/v1/timesheets', timesheet).pipe(map((response: Object) => response['timesheet']));
    }

    upsertAttendanceFrom(personId: number): Observable<any> {
        let from = {
            personId: personId,
            from: 'now'
        };
        console.log('upserting '+JSON.stringify(from));
        return this.http.post('/api/v1/timesheets', from);
    }

    upsertAttendanceTo(personId: number): Observable<any> {
        let to = {
            personId: personId,
            to: 'now'
        };
        console.log('upserting '+JSON.stringify(to));
        return this.http.post('/api/v1/timesheets', to);
    }

    addLeave(personId: number, from: string, to: string): Observable<any> {
        let leave = {
            personId: personId,
            from: from,
            to: to
        };

        console.log('adding Leave '+JSON.stringify(leave));
        return this.http.post('/api/v1/timesheets/leave', leave);
    }


    private getTimesheets(response:any):any {
        let timesheets: Timesheet[] = [];

        if (response.list && response.list.length > 0) {
            for (let timesheet of response.list) {
                timesheets.push(timesheet);
            }
        }

        console.log('Got '+JSON.stringify(timesheets));
        return timesheets;
    }
}