import { Component, OnInit } from '@angular/core';
import { UsersPayrollComponent } from 'app/users-payroll/users-payroll.component';
import { Router } from '@angular/router';
import { UserService, PayrollService, AlertService, DictService, ToolsService, AuthenticationService, CompletedOrderService } from 'app/_services';
import { UserPayroll, User } from 'app/_models';
import { stringify } from 'querystring';

@Component({
  selector: 'app-users-payroll-report',
  templateUrl: './users-payroll-report.component.html',
  styleUrls: ['./users-payroll-report.component.css']
})
export class UsersPayrollReportComponent  implements OnInit {

  dateFrom: Date;
  dateTo: Date;
  budgetData: any;
  poolRateData: any;
  payrollCostData: any;
  data: any;

  operator:User;
  users: Map<number, User>;
  historicalPayrolls: UserPayroll[];

  constructor(protected router:Router,
              protected userService:UserService,
              protected payrollService:PayrollService,
              protected alertService:AlertService,
              protected dictService:DictService,
              protected toolsService:ToolsService,
              protected authService:AuthenticationService,
              public completedOrderService: CompletedOrderService){

               }
  ngOnInit() {
    this.authService.userAsObs.subscribe(user => this.getAllUsers(user));
  }

  private getHistoricalPayrolls(payrolls:UserPayroll[]):void {
    this.historicalPayrolls = payrolls;
    let dataForPoolRate: Map<string, string> = new Map<string, string>();
    for (let payroll of payrolls) {
        dataForPoolRate.set(payroll.periodDate, payroll.formattedPoolRate);
    }
    this.generatePoolRateChar(dataForPoolRate);
    // let dataForBudget: Map<string, number> = new Map<string, number>();
    // for (let payroll of payrolls) {
    //     dataForPoolRate.set(payroll.periodDate, payroll.budget);
    // }
    let dataForPayrollCost: Map<string, number> = new Map<string, number>();
    for (let payroll of payrolls) {
      dataForPayrollCost.set(payroll.periodDate, this.calculatePayrollCost(payroll.periodDate));
    }
    this.generatePayrollCostChar(dataForPayrollCost);
}
private generatePayrollCostChar (payrolls: Map<string, number> ) {
  this.payrollCostData = {
    labels: [],
    datasets: [
        {
            label: 'Koszt wypłat',
            data: [],
            fill: false,
            borderColor: '#4bc0c0'
        },
    ]
  }
  payrolls.forEach((payrollCost: number, date: string) => {
    this.payrollCostData.labels.push(date);
    this.payrollCostData.datasets[0].data.push(payrollCost);
  });
}
private generatePoolRateChar (payrolls: Map<string,string>){
  this.poolRateData = {
    labels: [],
    datasets: [
        {
            label: 'Stawka w puli',
            data: [],
            fill: false,
            borderColor: '#4bc0c0'
        },
    ]
}
 payrolls.forEach((pollRate: string, date: string) => {
   this.poolRateData.labels.push(date);
   this.poolRateData.datasets[0].data.push(pollRate);
 });
}
private getAllUsers(user:User):void {
  if (user) {
      this.operator = user;
      //FIXME - we dont check history if one was EN once and then was changed to CN we are in trouble
      //this.userService.getAllStaff().subscribe(staff => this.usersToMapSearchPayrolls(staff));
      this.userService.getAll().subscribe(staff => this.MapUsersAndPayrolls(staff));
  } else {
      console.log("Cannot init, no data on logged user!");
  }
}

private MapUsersAndPayrolls(staff:User[]):void {
  this.users = new Map<number, User>();
  for (let user of staff) {
      this.users.set(user.id, user);
  }
  //this.searchPayrolls();
  this.payrollService.getHistorical(this.users).subscribe(userPayrolls => this.getHistoricalPayrolls(userPayrolls));

}
public calculatePayrollCost(periodDate: string): number {

  let payrolls: UserPayroll[] = this.historicalPayrolls;
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

}
