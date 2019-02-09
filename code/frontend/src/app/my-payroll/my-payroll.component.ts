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

    constructor(private payrollService:PayrollService,
                private authSerice:AuthenticationService,
                public completedOrderService: CompletedOrderService) {
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.processUser(user));
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
