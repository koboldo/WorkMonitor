import { Component, OnInit } from '@angular/core';

import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';

import { User, CodeValue, UserPayroll } from '../_models/index';
import { UserService, DictService, AlertService, AuthenticationService, ToolsService, PayrollService, WOService } from '../_services/index';
import { CompletedOrderService } from '../_services/completedOrders.service';


@Component({
    selector: 'app-my-payroll',
    templateUrl: './my-payroll.component.html',
    styleUrls: ['./my-payroll.component.css']
})
export class MyPayrollComponent implements OnInit {

    user: User;

    currentPayroll: UserPayroll[];
    historicalPayrolls: UserPayroll[];

    cols: any;

    constructor(private payrollService:PayrollService,
                private authSerice:AuthenticationService,
                public completedOrderService: CompletedOrderService) {
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.processUser(user));
        this.cols = [
            { field: 'user.lastName', header: 'Osoba',class:"width-100 text-center", user:true, icon:true},
            { field: 'none',excludeGlobalFilter: true , button: true, completedOrders:true, icone:true, class:"width-35"},        
            { field: 'rank', header: 'Stopień', class:"width-100 text-center"},        
            { field: 'projectFactor', header: 'Współ.', class:"width-135 text-center"},
            { field: 'isFromPool', header: 'Pula',complexity:true, icon:true,class:"width-50 text-center", isFromPool:true },
            { field: 'workTime', header: 'Czas pracy',class:"width-100 text-center color-blue", time:true, icon:true },
            { field: 'poolWorkTime', header: 'Czas dla puli',class:"width-80 text-center color-blue", time:true, icon:true},
            { field: 'nonpoolWorkTime', header: 'Czas poza pulą', class:"width-100 text-center color-blue", icon:true},
            { field: 'trainingTime', header: 'Szkolenia',class:"width-100 text-center color-blue", time:true, icon:true },
            { field: 'overTime', header: 'Nadgodziny' , class:"width-100 text-center color-blue", time:true, icon:true},
            { field: 'leaveTime', header: 'Urlop', class:"width-100 text-center color-blue", time:true, icon:true},
            { field: 'workDue', header: 'Obecnosc PLN', class:"width-125 text-right",price:true, icon:true },
            { field: 'trainingDue', header: 'Szkolenia PLN' , class:"width-125 text-right",price:true, icon:true},
            { field: 'overDue', header: 'Nadgodziny PLN' , class:"width-125 text-right",price:true, icon:true},
            { field: 'leaveDue', header: 'Urlop PLN' , class:"width-125 text-right",price:true, icon:true},
            { field: 'totalDue', header: 'Suma PLN' , class:"width-125 text-right", price:true, icon:true},       
        ]
    }

    search() {
        this.payrollService.getCurrentPersonal(this.user).subscribe(payroll => this.currentPayroll = payroll);
        this.payrollService.getHistoricalPersonal(this.user).subscribe(payroll => this.historicalPayrolls = payroll);
    }

    private processUser(user:User):void {
        this.user = user;
        this.search();
    }

}
