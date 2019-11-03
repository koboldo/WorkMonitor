import { Component, OnInit, NgModule, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { AlertService, UserService, DictService, AuthenticationService, PayrollService, ToolsService, WOService } from '../_services/index';
import { CompletedOrderService } from '../_services/completedOrders.service';
import { User, CodeValue, SearchUser, UserPayroll, Order } from '../_models/index';
import { SelectItem, DataTable } from 'primeng/primeng'
import {ToastModule} from 'primeng/toast';


import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap, groupBy } from 'rxjs/operators';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';
import { MenuItem } from 'primeng/primeng';
import { element } from '@angular/core/src/render3/instructions';


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
    periodForDropDown: SelectItem[];
    selectedPeriod: string;
    rowGroupMetadata: any;
    historicalPayrollsFiltered: UserPayroll[];
    firsHistoricalPayroll: UserPayroll;

    data: any;

    constructor(protected router:Router,
                protected userService:UserService,
                protected payrollService:PayrollService,
                protected alertService:AlertService,
                protected dictService:DictService,
                protected toolsService:ToolsService,
                protected authService:AuthenticationService,
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
            { field: 'none',excludeGlobalFilter: true , button: true, details:true, icone:true, class:"width-20 text-center"},
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

    GenerateReports () {
        this.data = {
            labels: [],
            datasets: [
                {
                    label: 'Stawka w puli',
                    data: [],
                    fill: false,
                    borderColor: '#4bc0c0'
                },
                {
                    label: 'Wypłaty',
                    data: [],
                    fill: false,
                    borderColor: '#565656'
                },
                {
                    label: 'Budżet puli',
                    data: [],
                    fill: false,
                    borderColor: '#565656'
                }
            ]
        }
        this.periodForDropDown.forEach(element => {
            this.data.labels.push(element.value);
            let payrolForMont = this.historicalPayrolls.filter(item=> item.formattedPeriodDate === element.value)[0];
            //this.data.datasets[0].data.push(payrolForMont.poolRate);
            this.data.datasets[1].data.push(this.calculatePayrollCost(payrolForMont.periodDate));
            //this.data.datasets[2].data.push(payrolForMont.budget);
        });
    }


    selectData(event) {
       // this.messageService.add({severity: 'info', summary: 'Data Selected', 'detail': this.data.datasets[event.element._datasetIndex].data[event.element._index]});
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
        if (this.currentPayroll && this.currentPayroll.length > 0 && this.currentPayroll[0].periodDate === periodDate) {
            return true;
        }
        return false;
    }

    public calculatePayrollCost(periodDate: string): number {

        let payrolls: UserPayroll[] = this.isCurrent(periodDate)? this.currentPayroll: this.historicalPayrolls;
        if (payrolls) {
          return this.calculatePayrollCostFromPayrolls(payrolls, periodDate);
        } else {
            return 0;
        }
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

    /**
    * Workaround for backend bug
    * @param {string} periodDate
    * @returns {UserPayroll}
    */
    public getRightPayrollRecord(periodDate: string): UserPayroll {
      let payrolls: UserPayroll[] = this.isCurrent(periodDate)? this.currentPayroll: this.historicalPayrolls;
      for (let payroll of payrolls) {
          if (payroll && payroll.periodDate && payroll.periodDate === periodDate) {
                if (payroll.workTime > 0) {
                    return payroll;
                }
          }
      }
      //I want error in GUI if not found
      return null;
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
        if (this.aSelectedPayroll && this.aSelectedPayroll.periodDate) {
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

        // magic completedWo string example -> "completedWo": "17228:420::0.5:::Y|18159:420::0.5:::Y",
        let orderId2Magic: Map<number, string> = new Map();

        for (let payroll of payrolls) {
            if (payroll.periodDate && payroll.periodDate === periodDate && payroll.completedWo) {
                let completedOrders: string[] = payroll.completedWo ? payroll.completedWo.split("|") : [];
                for(let completedOrder of completedOrders) {
                    let id: number = +completedOrder.split(":")[0];
                    orderId2Magic.set(id, completedOrder);
                }
            }
        }

        this.completedOrderService.showOrdersByIds(periodDate, orderId2Magic);

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

        let tmpMapForDropDownPeriodList: Map<string, string> = new Map<string, string>();
        for (let payroll of payrolls) {
            tmpMapForDropDownPeriodList.set(payroll.formattedPeriodDate, payroll.formattedPeriodDate);
        }
        let tab = Array.from(tmpMapForDropDownPeriodList.values()).sort().reverse();
        this.periodForDropDown = [];
        tab.forEach(element => {
            this.periodForDropDown.push({label: element, value:element});
        });

        this.selectedPeriod = this.periodForDropDown[0] ? this.periodForDropDown[0].value : undefined;
        if (this.selectedPeriod) {
          this.setHistroicalPayrolls();
        }
    }

    private getRecalculateButtonStyle(periodDate: string):string {
        let theDate: Date = this.toolsService.parseDate(periodDate+' 00:00:01');
        let now: Date = new Date();
        let diffMs: number = now.getTime() - theDate.getTime();

        //console.log('diffMs: '+diffMs+', theDate:'+this.toolsService.formatDate(theDate, 'yyyy-MM-dd'));
        if (diffMs > 3*this.AVG_MONTH_MS) {
            return 'ui-button-danger';
        } else if (diffMs > 2*this.AVG_MONTH_MS) {
            return 'ui-button-warning';
        }
        return 'ui-button-success';
    }

    public setHistroicalPayrolls() {
        this.historicalPayrollsFiltered = [];
        
        this.historicalPayrolls.forEach(element => {
            if (element.formattedPeriodDate === this.selectedPeriod) {
                this.historicalPayrollsFiltered.push(element);
            }         
        });
        this.firsHistoricalPayroll = this.historicalPayrollsFiltered[0];
    }

}
