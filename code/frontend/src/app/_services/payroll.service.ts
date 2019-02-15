import { Injectable } from '@angular/core';
import { User, Order } from '../_models/index';
import { UserPayroll } from '../_models/userPayroll';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs';

import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';

@Injectable()
export class PayrollService {

    constructor(private http: HttpBotWrapper, private dictService: DictService) {
        console.log("created PayrollService");
    }

    public getCurrent(users: Map<number, User>): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll').pipe(
            map((response: Object) => this.getJoined(response, users)));
    }

    public getHistorical(users: Map<number, User>): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll?history=Y').pipe(
            map((response: Object) => this.getJoined(response, users))
        );
    }

    public approve(users: Map<number, User>, periodDate: string, overTimeFactor: number): Observable<UserPayroll[]> {
        // /payroll?periodDate=yyyy-mm-dd&overTimeFactor=XXX&approved=Y
        return this.http.get('/api/v1/payroll?periodDate='+periodDate+'&overTimeFactor='+overTimeFactor+'&approved=Y').pipe(
            map((response: Object) => this.getJoined(response, users))
        );
    }

    public getCurrentPersonal(user: User): Observable<UserPayroll[]> {
        let users: Map<number, User> = new Map<number, User>();
        users.set(user.id, user);

        return this.http.get('/api/v1/payroll/'+user.id).pipe(
            map((response: Object) => this.getJoined(response, users))
        );
    }

    public getHistoricalPersonal(user: User): Observable<UserPayroll[]>  {
        let users: Map<number, User> = new Map<number, User>();
        users.set(user.id, user);

        return this.http.get('/api/v1/payroll/'+user.id+'?history=Y').pipe(
            map((response: Object) => this.getJoined(response, users))
        );
    }


    private getJoined(response:any, users:Map<number, User>):UserPayroll[] {

        if (response.list && response.list.length > 0) {
            let payrolls : UserPayroll[] =  response.list;
            for (let payroll of payrolls) {
                payroll.workTime += payroll.trainingTime;

                payroll.user = users.get(payroll.personId);
                payroll.modifiedByUser = users.get(payroll.modifiedBy);
                payroll.rank = this.dictService.getRank(payroll.rankCode);
                payroll.formattedPoolRate = payroll.poolRate? ""+payroll.poolRate: "-";
                payroll.formattedOverTimeFactor = payroll.overTimeFactor * 100 + "%";
                payroll.formattedPeriodDate = payroll.periodDate ? payroll.periodDate.substr(0,7) : '';
            }
            return payrolls;
        }

        return [];
    }




}