import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User, Order } from '../_models/index';
import { UserPayroll } from '../_models/userPayroll';
import { HttpInterceptor } from '../_services/httpInterceptor.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';

@Injectable()
export class PayrollService {

    constructor(private http: HttpInterceptor, private dictService: DictService) {
        console.log("created PayrollService");
    }

    public getCurrent(users: Map<number, User>): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll')
            .map((response: Response) => this.getJoined(response.json(), users));
    }

    public getHistorical(users: Map<number, User>): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll?history=Y')
            .map((response: Response) => this.getJoined(response.json(), users));
    }

    public approve(users: Map<number, User>, periodDate: string, overTimeFactor: number): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll?periodDate='+periodDate+'&overTimeFactor='+overTimeFactor+'&approved=Y')
            .map((response: Response) => this.getJoined(response.json(), users));
    }




    private getJoined(response:any, users:Map<number, User>):UserPayroll[] {

        if (response.list && response.list.length > 0) {
            let payrolls : UserPayroll[] =  response.list;
            for (let payroll of payrolls) {
                payroll.user = users.get(payroll.personId);
                payroll.modifiedByUser = users.get(payroll.modifiedBy);
                payroll.rank = this.dictService.getRank(payroll.rankCode);
            }
            return payrolls;
        }

        return [];
    }




}