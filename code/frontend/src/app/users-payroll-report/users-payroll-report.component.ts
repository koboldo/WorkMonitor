import { Component, OnInit } from '@angular/core';
import { UsersPayrollComponent } from 'app/users-payroll/users-payroll.component';
import { Router } from '@angular/router';
import { UserService, PayrollService, AlertService, DictService, ToolsService, AuthenticationService, CompletedOrderService } from 'app/_services';
import { UserPayroll, User, Calendar } from 'app/_models';
import { stringify } from 'querystring';
import { DataForPayrollsReport } from 'app/_models/dataForPayrollsReport';
import { DataTable } from 'primeng/primeng';


@Component({
  selector: 'app-users-payroll-report',
  templateUrl: './users-payroll-report.component.html',
  styleUrls: ['./users-payroll-report.component.css']
})
export class UsersPayrollReportComponent extends UsersPayrollComponent implements OnInit {

  dateFrom: Date;
  dateTo: Date;
  budgetData: any;
  poolRateData: any;
  payrollCostData: any;
  data: any;
  cols: any;
  payrollReportData: DataForPayrollsReport [] = [];
  yearRangeForDatePicker: string;

  operator:User;
  users: Map<number, User>;
  historicalPayrolls: UserPayroll[];
  pl: Calendar;
  optionsForChart :any;


  constructor(protected router:Router,
              protected userService:UserService,
              protected payrollService:PayrollService,
              protected alertService:AlertService,
              protected dictService:DictService,
              protected toolsService:ToolsService,
              protected authService:AuthenticationService,
              protected toolService: ToolsService,
              public completedOrderService: CompletedOrderService){
              super (router,userService,payrollService,alertService,dictService,toolService,authService,completedOrderService)
               }
  ngOnInit() {
    this.dateTo = new Date();
    this.dateFrom = new Date(this.dateTo.getFullYear() -1, this.dateTo.getMonth());
    this.yearRangeForDatePicker = (this.dateTo.getFullYear() - 3).toString() + ':' + (this.dateTo.getFullYear() + 3).toString();
    this.authService.userAsObs.subscribe(user => this.getAllUsers(user));
    this.cols=[
      { field: 'date', header:'Okres', date: true , sortable: true},
      { field: 'poolRate', header:'Stawka w puli ', date: false, sortable: true, isNumber: true},
      { field: 'budget', header:'Budżet', date: false,sortable: true},
      { field: 'payrollCost', header:'Koszt wypłat', date: false,sortable: true}, 
    ];
    this.pl=new Calendar();
    this.optionsForChart = {
      tooltips: {
        callbacks: {
            label: function(tooltipItem) {
                return " Wartość: " + Number(tooltipItem.yLabel).toFixed(2) + " zł";
            }
        }
    },
    };
  }

  public  testExportCSV(table: DataTable) {
    let tt= [];
    table.columns.forEach(column=> {
      if(column.field === 'poolRate') 
      {
        
        let s = column.field.toString().replace('.',',');
        tt.push({field: column.field , col: column});
        column.field= "1234";
       
      }
    });
    // table.columns.forEach(function (record, i)  {
    //   console.log(table.resolveFieldData(record,record.header));
    //   console.log(table.resolveFieldData(record,record.field));
    // });
    table.exportCSV();
    tt.forEach((t)=> {
      t.col.field = t.field;
    });
    
    this.payrollReportData.forEach(element => {
     console.log(element.poolRate.toString());
     console.log(element.poolRate.toString().replace('.',','));
    });
    // table.selection = tt;
    // table.exportCSV({selectionOnly:true})
  }
  refresh () {
    this.payrollReportData = [];
    this.authService.userAsObs.subscribe(user => this.getAllUsers(user));
  }

  public generateDataForCharts(payrolls:UserPayroll[]):void {
    this.historicalPayrolls = payrolls;
    let to = this.toolsService.parseDate(this.dateTo.toString());
    let from = this.toolsService.parseDate(this.dateFrom.toString());
    payrolls = payrolls.filter((element)=> {
      let date = this.toolsService.parseDate(element.formattedPeriodDate);
      if (date <= to && date >= from )   
          return element; 
    });
    let dataForPoolRate: Map <string,string> = new Map<string, string>();
    for (let payroll of payrolls) {
        dataForPoolRate.set(payroll.formattedPeriodDate, payroll.formattedPoolRate);
    }
    this.generatePoolRateChar(new Map(Array.from(dataForPoolRate).sort()));
    
    let dataForBudget: Map<string, string> = new Map<string, string>();
    for (let payroll of payrolls) {
      dataForBudget.set(payroll.formattedPeriodDate, payroll.budget);
    }
    this.generatePyrollBudgetChar(new Map(Array.from(dataForBudget).sort()));

    let dataForPayrollCost: Map<string, number> = new Map<string, number>();
    for (let payroll of payrolls) {
      dataForPayrollCost.set(payroll.formattedPeriodDate, super.calculatePayrollCost(payroll.periodDate));
    }
    this.generatePayrollCostChar(new Map(Array.from(dataForPayrollCost).sort()));
}
private generatePyrollBudgetChar (payrolls: Map <string,string>) {
  this.budgetData = {
    labels: [],
    datasets: [
        {
            label: 'Budżet',
            data: [],
            fill: false,
            borderColor: '#4bc0c0'
        },
    ]
  }
  payrolls.forEach((payrollBudget: string, payrollDate: string) => {
    this.budgetData.labels.push(payrollDate);
    this.budgetData.datasets[0].data.push(payrollBudget);
    let dataToUpdate = this.payrollReportData.find(item=> item.date === payrollDate);
    dataToUpdate.budget = payrollBudget;
  });
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
    let dataToUpdate = this.payrollReportData.find(item=> item.date === date);
    dataToUpdate.payrollCost = payrollCost;
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
   this.payrollReportData.push({budget: '', date: date, poolRate: pollRate, payrollCost: 0});
 });
}
private getAllUsers(user:User):void {
  if (user) {
      this.operator = user;
      if (user.roleCode.indexOf('PR') > -1) {
          //FIXME - we dont check history if one was EN once and then was changed to CN we are in trouble
          this.userService.getAll().subscribe(staff => this.MapUsersAndPayrolls(staff));
      }
  } else {
      console.log("Cannot init, no data on logged user!");
  }
}

private MapUsersAndPayrolls(staff:User[]):void {
    this.users = new Map<number, User>();
    for (let user of staff) {
        this.users.set(user.id, user);
    }
    this.payrollService.getHistorical(this.users).subscribe(userPayrolls => this.generateDataForCharts(userPayrolls));
  } 
}
