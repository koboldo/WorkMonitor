import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService, AuthenticationService, PayrollService } from '../_services/index';
import { User, CodeValue, SearchUser, UserPayroll } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime.js';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';
import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-users-payroll',
    templateUrl: './users-payroll.component.html',
    styleUrls: ['./users-payroll.component.css'],
    providers: [PayrollService]
})
export class UsersPayrollComponent implements OnInit {

    items:MenuItem[] = [];

    operator:User;
    users: Map<number, User>;
    overTimeFactor: number = 100;

    currentPayroll: UserPayroll[];
    historicalPayrolls: UserPayroll[];
    approvedPayroll: UserPayroll[]; // just to show in dialog what's been confirmed

    periodDates: SelectItem[];

    displayApproveDialog: boolean;
    displayApproveResultDialog: boolean;


    constructor(private router:Router,
                private userService:UserService,
                private payrollService:PayrollService,
                private alertService:AlertService,
                private dictService:DictService,
                private authService:AuthenticationService) {


    }

    ngOnInit():void {
        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.initAll(user));
    }

    private searchPayrolls():void {
        this.payrollService.getCurrent(this.users).subscribe(userPayrolls => this.currentPayroll = userPayrolls);
        this.payrollService.getHistorical(this.users).subscribe(userPayrolls => this.processHistorical(userPayrolls));
    }

    public routeToWorkMonitor():void {
        this.router.navigate(['/workMonitor']);
    }

    public showApproveDialog():void {
        this.displayApproveDialog = true;
    }

    public approve():void {
        this.displayApproveDialog = false;
        if (this.currentPayroll[0] && this.currentPayroll[0].periodDate) {
            this.payrollService.approve(this.users, this.currentPayroll[0].periodDate, this.overTimeFactor/100.0)
                .subscribe(approvedPayroll => this.showApproveResult(approvedPayroll));
        }
    }

    private showApproveResult(approvedPayroll:UserPayroll[]):void {
        this.approvedPayroll = approvedPayroll;
        this.displayApproveResultDialog = true;
    }

    private initAll(user:User):void {
        if (user) {
            this.operator = user;
            this.userService.getAllStaff().subscribe(staff => this.usersToMapSearchPayrolls(staff));
        } else {
            console.log("Cannot init, no data on logged user!");
        }
    }

    private usersToMapSearchPayrolls(staff:User[]):void {
        this.users = new Map<number, User>();
        for (let user of staff) {
            this.users.set(user.id, user);
        }
        this.searchPayrolls();
    }

    private processHistorical(payrolls:UserPayroll[]):void {
        this.historicalPayrolls = payrolls;

        let tmpBillingCycles: Map<string, string> = new Map<string, string>();
        for (let payroll of payrolls) {
            tmpBillingCycles.set(payroll.periodDate, payroll.periodDate);
        }

        this.periodDates = [];
        tmpBillingCycles.forEach((value: string, key: string) => {
            this.periodDates.push({label: value, value: value});
        });
    }

}
