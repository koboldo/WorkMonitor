import { Component, OnInit, NgModule, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { AlertService, UserService, DictService, AuthenticationService, PayrollService, ToolsService, WOService } from '../_services/index';
import { CompletedOrderService } from '../_services/completedOrders.service';
import { User, CodeValue, SearchUser, UserPayroll, Order } from '../_models/index';
import { SelectItem, DataTable } from 'primeng/primeng'


import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';
import { MenuItem } from 'primeng/primeng';


@Component({
    selector: 'app-users-payroll',
    templateUrl: './users-payroll.component.html',
    styleUrls: ['./users-payroll.component.css']
})
export class UsersPayrollComponent implements OnInit {

    AVG_MONTH_MS: number = 30*24*60*60*1000;

    items:MenuItem[] = [];

    operator:User;
    users: Map<number, User>;
    overTimeFactor: number = 100;

    currentPayroll: UserPayroll[];
    historicalPayrolls: UserPayroll[];
    aSelectedPayroll: UserPayroll;
    approvedPayroll: UserPayroll[]; // just to show in dialog what's been confirmed
    approvedPayrollCost: number;

    periodDates: SelectItem[];

    displayApproveDialog: boolean;
    displayApproveResultDialog: boolean;
    selectedPayrolls: UserPayroll[];

    cols: any;
    colsHistorical: any;
    rowGroupMetadata: any;

    constructor(private router:Router,
                private userService:UserService,
                private payrollService:PayrollService,
                private alertService:AlertService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private authService:AuthenticationService,
                public completedOrderService: CompletedOrderService) {
    }

    ngOnInit():void {
        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.initAll(user));
        this.cols = [
            { field: 'user.excelId', header:'Id excel',  sortable: true, filter:true,class:"width-20 text-center", excelId:true},            
            { field: 'user.firstName', header: 'Imię',hidden:true, sortable: true, filter:true, firstName:true},
            { field: 'user.lastName', header: 'Osoba' , filter:true,sortable:true,  class:"width-50 text-center", lastName:true},
            { field: 'user.officeCode', header: 'Biuro', sortable:true, filter:true, class:"width-50 text-center", officeCode:true},
            { field: 'rank', header: 'Stopień' ,filter: true,  class:"width-50 text-center"},
            { field: 'projectFactor', header: 'Współ',sortable:true, filter:true,class:"width-35 text-center"},
            { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-20 text-center", isFromPool:true, icon:true},
            { field: 'workTime', header: 'Czas razem', sortable:true, filter:true, class:"width-35 text-center color-blue" },
            { field: 'poolWorkTime', header: 'Czas dla puli', sortable:true , filter:true, class:"width-35 text-center color-green"},
            { field: 'nonpoolWorkTime', header: 'Czas poza pulą' , sortable:true, filter:true, class:"width-50 text-center color-green"},          
            { field: 'trainingTime', header: 'Szkolenia', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'leaveTime', header: 'Urlop', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'overTime', header: 'Nadgodziny', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'workDue', header: 'Obecnosc PLN', sortable:true ,filter:true, class:"width-35 text-center", price:true},
            { field: 'trainingDue', header: 'Szkolenia PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'overDue', header: 'Nadgodziny PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'leaveDue', header: 'Urlop PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'totalDue', header: 'Suma PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
          ]
        this.colsHistorical = [
            { field: 'formattedPeriodDate', header:'Okres rozliczeniowy',hidden:true,  sortable: true, filter:true,class:"width-20 text-center"}, 
            { field: 'user.excelId', header:'Id excel',  sortable: true, filter:true,class:"width-20 text-center", excelId:true},            
            { field: 'user.firstName', header: 'Imię',hidden:true, sortable: true, filter:true, firstName:true},
            { field: 'user.lastName', header: 'Osoba' , filter:true,sortable:true,  class:"width-50 text-center", lastName:true},
            { field: 'user.officeCode', header: 'Biuro', sortable:true, filter:true, class:"width-50 text-center", officeCode:true},
            { field: 'rank', header: 'Stopień' ,filter: true,  class:"width-50 text-center"},
            { field: 'projectFactor', header: 'Współ',sortable:true, filter:true,class:"width-35 text-center"},
            { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-20 text-center", isFromPool:true, icon:true},
            { field: 'workTime', header: 'Czas razem', sortable:true, filter:true, class:"width-35 text-center color-blue" },
            { field: 'poolWorkTime', header: 'Czas dla puli', sortable:true , filter:true, class:"width-35 text-center color-green"},
            { field: 'nonpoolWorkTime', header: 'Czas poza pulą' , sortable:true, filter:true, class:"width-50 text-center color-green"},          
            { field: 'trainingTime', header: 'Szkolenia', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'leaveTime', header: 'Urlop', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'overTime', header: 'Nadgodziny', sortable:true ,filter:true, class:"width-35 text-center color-blue"},  
            { field: 'workDue', header: 'Obecnosc PLN', sortable:true ,filter:true, class:"width-35 text-center", price:true},
            { field: 'trainingDue', header: 'Szkolenia PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'overDue', header: 'Nadgodziny PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'leaveDue', header: 'Urlop PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
            { field: 'totalDue', header: 'Suma PLN', sortable:true ,filter:true, class:"width-35 text-center",price:true},
          ]
         
    }

    public exportCSV(text:string, table: DataTable)
    {
        this.selectedPayrolls=[];
        this.historicalPayrolls.forEach(element => {
            if (element.periodDate==text) {
                this.selectedPayrolls.push(element)
            }
        });
        table.selection=this.selectedPayrolls;
        table.exportCSV({selectionOnly:true});
    }

    public onTabOpen(event):void {
        console.log('open ' + event.index);
        this.searchPayrolls(false);
    }

    private saveCurrentAndSearchHist(userPayrolls:UserPayroll[]):void {
        this.currentPayroll = userPayrolls;
        this.payrollService.getHistorical(this.users).subscribe(userPayrolls => this.processHistorical(userPayrolls));
    }

    private searchPayrolls(refresh: boolean):void {
        if (refresh || this.historicalPayrolls === undefined || this.currentPayroll === undefined) {
            this.payrollService.getCurrent(this.users).subscribe(userPayrolls => this.saveCurrentAndSearchHist(userPayrolls));
        }
    }

    public routeToWorkMonitor():void {
        this.router.navigate(['/workMonitor']);
    }

    private isCurrent(periodDate: string): boolean {
        if (this.currentPayroll && this.currentPayroll[0].periodDate === periodDate) {
            return true;
        }
        return false;
    }

    public calculatePayrollCost(periodDate: string): number {

        let payrolls: UserPayroll[] = this.isCurrent(periodDate)? this.currentPayroll: this.historicalPayrolls;

        return this.calculatePayrollCostFromPayrolls(payrolls, periodDate);
    }

    private calculatePayrollCostFromPayrolls(payrolls: UserPayroll[], periodDate: string): number {
        let result: number = 0;
        for (let payroll of payrolls) {
            if (payroll.periodDate && payroll.periodDate === periodDate) {
                result += payroll.totalDue;
            }
        }

        return result;
    }

    public showApproveDialog(periodDate: string):void {
        let payrolls: UserPayroll[] = this.isCurrent(periodDate)? this.currentPayroll: this.historicalPayrolls;

        for(let payroll of payrolls) { // for just for historical
            if (payroll.periodDate && payroll.periodDate === periodDate) {
                this.aSelectedPayroll = payroll;
                this.overTimeFactor = this.aSelectedPayroll.overTimeFactor * 100;
                this.displayApproveDialog = true;
                return;
            }
        }
        this.alertService.error("Wewnętrzny, nie można znaleźć rekordu dla: "+periodDate);
    }

    public approve():void {
        this.displayApproveDialog = false;
        if (this.currentPayroll[0] && this.currentPayroll[0].periodDate) {
            this.payrollService.approve(this.users, this.aSelectedPayroll.periodDate, this.overTimeFactor/100.0)
                .subscribe(approvedPayroll => this.showApproveResult(approvedPayroll));
        }
    }

    private showApproveResult(approvedPayroll:UserPayroll[]):void {
        this.approvedPayroll = approvedPayroll;

        this.approvedPayrollCost = this.calculatePayrollCostFromPayrolls(approvedPayroll, approvedPayroll[0].periodDate);

        this.displayApproveResultDialog = true;
        this.searchPayrolls(true);
    }


    public showAllOrders(periodDate: string): void {
        let payrolls: UserPayroll[] = this.isCurrent(periodDate)? this.currentPayroll: this.historicalPayrolls;

        let orderIds: number[] = [];
        for (let payroll of payrolls) {
            if (payroll.periodDate && payroll.periodDate === periodDate && payroll.completedWo) {
                let ids: string[] = payroll.completedWo.split("|");
                for(let id of ids) {
                    if (orderIds.indexOf(+id) === -1) {
                        orderIds.push(+id);
                    }
                }
            }
        }

        this.completedOrderService.showOrdersByIds(periodDate, orderIds);

    }



    private initAll(user:User):void {
        if (user) {
            this.operator = user;
            //FIXME - we dont check history if one was EN once and then was changed to CN we are in trouble
            //this.userService.getAllStaff().subscribe(staff => this.usersToMapSearchPayrolls(staff));
            this.userService.getAll().subscribe(staff => this.usersToMapSearchPayrolls(staff));
        } else {
            console.log("Cannot init, no data on logged user!");
        }
    }

    private usersToMapSearchPayrolls(staff:User[]):void {
        this.users = new Map<number, User>();
        for (let user of staff) {
            this.users.set(user.id, user);
        }
        //this.searchPayrolls();
    }

    private processHistorical(payrolls:UserPayroll[]):void {
        this.historicalPayrolls = payrolls;

        let tmpBillingCycles: Map<string, string> = new Map<string, string>();
        for (let payroll of payrolls) {
            tmpBillingCycles.set(payroll.periodDate, payroll.periodDate);
            payroll.recalculateButtonStyle = this.getRecalculateButtonStyle(payroll.periodDate);
        }

        this.periodDates = [];
        tmpBillingCycles.forEach((value: string, key: string) => {
            this.periodDates.push({label: value, value: value});
        });
        this.updateRowGroupMetaData();
    }

    private getRecalculateButtonStyle(periodDate: string):string {
        let theDate: Date = this.toolsService.parseDate(periodDate+' 00:00:01');
        let now: Date = new Date();
        let diffMs: number = now.getTime() - theDate.getTime();

        console.log('diffMs: '+diffMs+', theDate:'+this.toolsService.formatDate(theDate, 'yyyy-MM-dd'));
        if (diffMs > 3*this.AVG_MONTH_MS) {
            return 'ui-button-danger';
        } else if (diffMs > 2*this.AVG_MONTH_MS) {
            return 'ui-button-warning';
        }
        return 'ui-button-success';
    }

    public updateRowGroupMetaData() {
        this.rowGroupMetadata = {};
        if (this.historicalPayrolls) {
            for (let i = 0; i < this.historicalPayrolls.length; i++) {
                let rowData = this.historicalPayrolls[i];
                let formattedPeriodDate = rowData.formattedPeriodDate;
                if (i == 0) {
                    this.rowGroupMetadata[formattedPeriodDate] = { index: 0, size: 1 };
                }
                else {
                    let previousRowData = this.historicalPayrolls[i - 1];
                    let previousRowGroup = previousRowData.formattedPeriodDate;
                    if (formattedPeriodDate === previousRowGroup)
                        this.rowGroupMetadata[formattedPeriodDate].size++;
                    else
                        this.rowGroupMetadata[formattedPeriodDate] = { index: i, size: 1 };
                }
            }
        }
    }


}
