import {Injectable} from '@angular/core';

import {User, Order, Timesheet} from '../_models/index';
import {HttpBotWrapper} from '../_services/httpBotWrapper.service';
import {DictService} from '../_services/dict.service';

import {Observable} from 'rxjs';
import {catchError, map, tap, delay, mergeMap} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {ClientDeviceService} from "./clientDevice.service";


@Injectable()
export class TimesheetService {

  private isMobileDevice: boolean;

  constructor(private http: HttpBotWrapper, private dictService: DictService, private clientDeviceService: ClientDeviceService) {
    console.log('TimesheetService created');
    this.isMobileDevice = this.clientDeviceService.isMobileDevice;
  }

  getByDates(workDateAfter: string, workDateBefore: string): Observable<Timesheet[]> {
    return this.http.get('/api/v1/timesheets?workDateAfter=' + workDateAfter + '&workDateBefore=' + workDateBefore)
    .pipe(map((response: Object) => this.getTimesheets(response)));
  }

  getIsLeavByDates(workDateAfter: string, workDateBefore: string): Observable<Timesheet[]> {
    return this.http.get('/api/v1/timesheets?workDateAfter=' + workDateAfter + '&workDateBefore=' + workDateBefore)
    .pipe(map((response: Object) => this.getIsLeaveTimesheets(response)));
  }

  getByIdAndDates(id: number, workDateAfter: string, workDateBefore: string): Observable<Timesheet[]> {
    return this.http.get('/api/v1/timesheets?workDateAfter=' + workDateAfter + '&workDateBefore=' + workDateBefore + '&personId=' + id)
    .pipe(map((response: Object) => this.getTimesheets(response)))
  }

  upsert(timesheet: Timesheet): Observable<Timesheet> {
    console.log('upserting ' + JSON.stringify(timesheet));
    return this.http.post('/api/v1/timesheets', timesheet).pipe(map((response: Object) => response['timesheet']));
  }

  upsertAttendanceFrom(personId: number): Observable<any> {
    let from = {
      fromMobileDevice: this.isMobileDevice,
      personId: personId,
      from: 'now'
    };
    console.log('upserting (from)' + JSON.stringify(from));
    return this.http.post('/api/v1/timesheets', from);
  }

  upsertAttendanceBreak(personId: number, totalBreakInMinutes: number): Observable<any> {
    let theBreak = {
      personId: personId,
      break: totalBreakInMinutes
    };
    console.log('upserting ' + JSON.stringify(theBreak));
    return this.http.post('/api/v1/timesheets', theBreak);
  }

  upsertAttendanceTo(personId: number): Observable<any> {
    let to = {
      toMobileDevice: this.isMobileDevice,
      personId: personId,
      to: 'now'
    };
    console.log('upserting (to) ' + JSON.stringify(to));
    return this.http.post('/api/v1/timesheets', to);
  }

  addLeave(personId: number, from: string, to: string): Observable<any> {
    let leave = {
      personId: personId,
      from: from,
      to: to
    };

    console.log('adding Leave ' + JSON.stringify(leave));
    return this.http.post('/api/v1/timesheets/leave', leave);
  }


  private getTimesheets(response: any): any {
    let timesheets: Timesheet[] = [];

    if (response.list && response.list.length > 0) {
      for (let timesheet of response.list) {
        timesheets.push(timesheet);
      }
    }

    console.log('Got ' + JSON.stringify(timesheets));
    return timesheets;
  }

  private getIsLeaveTimesheets(response: any): any {
    let timesheets: Timesheet[] = [];
    if (response.list && response.list.length > 0) {
      for (let timesheet of response.list) {
        if (timesheet.isLeave === 'Y') {
          timesheets.push(timesheet);
        }        
      }
    }
    console.log('Got ' + JSON.stringify(timesheets));
    return timesheets;
  }
}