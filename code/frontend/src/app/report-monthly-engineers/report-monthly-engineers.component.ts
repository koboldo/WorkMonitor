import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';


import { User, MonthlyUserReport, RelatedItem, Order, WorkType, CodeValue, Timesheet, DateRange } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';
import { Calendar } from '../_models/calendar';

declare var jquery:any;
declare var $ :any;


@Component({
  selector: 'app-report-monthly-engineers',
  templateUrl: './report-monthly-engineers.component.html',
  styleUrls: ['./report-monthly-engineers.component.css']
})
export class ReportMonthlyEngineersComponent implements OnInit {

  NO_MONTHS: number = 6;
  holidays: number = -1;
  noTimesheets: number = -2;

  emptyData: number[] = [];

  reports: MonthlyUserReport[];
  selectedReports: MonthlyUserReport[];


  workTypes: WorkType[];

  chartsReady: boolean;
  lineUtilizationData: any;
  avgUtilizationData: any;
  lineUtilizationOptions: any;
  lineEarnedData: any;
  totalEarnedData: any;
  lineEarnedOptions: any;

  colors: string[] = ['#b52aaf','#b52aaf','#6a1341','#6a1341','#c5cb6b','#c5cb6b','#68870d','#68870d','#47781d','#47781d','#fa980c','#fa980c','#12999c','#12999c','#a16e65','#a16e65','#d445c8','#d445c8','#b652fa','#b652fa','#542148','#542148','#f225ba','#ec38b1','#ec38b1','#6c4b76','#6c4b76','#b8a541','#b8a541','#c30f52','#c30f52','#c2e58c','#c2e58c','#911215','#911215','#45cbed','#45cbed','#f8bbde','#f8bbde','#1501f6','#1501f6','#bc2533','#bc2533','#42c438','#42c438','#4ea38a','#4ea38a','#a7774d','#a7774d','#5d9311','#5d9311','#26a864','#26a864','#92427a','#92427a','#339a5a','#339a5a','#a2ab53','#a2ab53','#c35e87','#c35e87','#c20c91','#c20c91','#a69e52','#a69e52','#85a6fc','#85a6fc','#f591de','#f591de','#be7dea','#be7dea','#546305','#546305','#769c11','#769c11','#4c6e55','#4c6e55','#bf3e19','#bf3e19','#132776','#132776','#30750d','#30750d','#44d240','#44d240','#3c00ca','#3c00ca','#5e72c7','#5e72c7','#3f16cd','#3f16cd','#3af2ad','#3af2ad','#ee79fd','#ee79fd','#e515d1','#e515d1','#c8ae00','#c8ae00','#9aba2f','#9aba2f','#d79179','#d79179','#a5cc12','#a5cc12','#fce3a0','#fce3a0','#a73775','#a73775','#77171f','#77171f','#f4d5a6','#f4d5a6','#e115e7','#e115e7','#661889','#661889','#83f557','#83f557','#d9d96f','#d9d96f','#9dd18c','#9dd18c','#eddc80','#eddc80','#fb3dc4','#fb3dc4','#961066','#961066','#4035f0','#4035f0','#46061b','#46061b','#b547d4','#b547d4','#99ba47','#99ba47','#3bb9a8','#3bb9a8','#3cb96c','#3cb96c','#c98b7c','#c98b7c','#45cc62','#45cc62','#bc7a3b','#bc7a3b','#68ed99','#68ed99','#24c7b4','#24c7b4','#0bab07','#0bab07','#5fc181','#5fc181','#bef91a','#bef91a','#69f98a','#69f98a','#75378f','#75378f','#30cd4a','#30cd4a','#2d2cda','#2d2cda','#d7e491','#d7e491','#e3b221','#e3b221','#c0fbe5','#c0fbe5','#ea0bfa','#ea0bfa','#4ab834','#4ab834','#d1fc8e','#d1fc8e','#22b543','#22b543','#e44dae','#e44dae','#3d5634','#3d5634','#1a170b','#1a170b','#edce07','#edce07','#89f020','#89f020','#58c5e4','#58c5e4','#030c83','#030c83','#422819','#422819','#ce5be9','#ce5be9','#f225ba'];


  constructor(private woService:WOService,
              private userService:UserService,
              private workTypeService:WorkTypeService,
              private dictService:DictService,
              private alertService:AlertService,
              private toolsService:ToolsService,
              private timesheetService: TimesheetService) {

    this.dictService.init();
    this.workTypeService.init();

    this.lineUtilizationOptions = {
      title: {
        display: true,
        text: 'Wydajność [%]',
        fontSize: 16
      },
      legend: {
        position: 'top'
      }
    };

    this.lineEarnedOptions = {
      title: {
        display: true,
        text: 'Wkład [PLN]',
        fontSize: 16
      },
      legend: {
        position: 'top'
      }
    };

  }

  ngOnInit() {

    this.workTypeService.getAllWorkTypes().subscribe(workTypes => this.workTypes = workTypes);

    this.search();
  }

  public filterReports(event): void {
    console.log('onSelect event fired!'+JSON.stringify(event));
    if (!event.type || event.type === 'checkbox') {
      this.calculateLineCharts(this.reports);
      console.log('DONE line for '+this.selectedReports.length);
    } else {
      console.log('onSelect event fired and consumed!'+JSON.stringify(event));
    }
  }

  private initMonths(): DateRange[] {
    let result : DateRange[] = [];

    for (let i = this.NO_MONTHS; i >= 1; i--) {
      let date = new Date();
      date.setMonth(date.getMonth() - i);
      let firstDay: Date = new Date(date.getFullYear(), date.getMonth(), 1);
      let lastDay: Date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      console.log('next period from '+this.toolsService.formatDate(firstDay, 'yyyy-MM-dd')+' to '+this.toolsService.formatDate(lastDay, 'yyyy-MM-dd'))
      result.push(new DateRange(firstDay, lastDay));
      this.lineUtilizationData.labels.push(this.toolsService.formatDate(firstDay, 'yyyy-MM'));
      this.avgUtilizationData.labels.push(this.toolsService.formatDate(firstDay, 'yyyy-MM'));
      this.lineEarnedData.labels.push(this.toolsService.formatDate(firstDay, 'yyyy-MM'));
      this.totalEarnedData.labels.push(this.toolsService.formatDate(firstDay, 'yyyy-MM'));
      this.emptyData.push(0);
    }
    console.log('periods '+JSON.stringify(result));
    return result;
  }

  public search() {

    this.lineUtilizationData = {labels: [], datasets: []}
    this.avgUtilizationData = {labels: [], datasets: []}
    this.lineEarnedData = {labels: [], datasets: []}
    this.totalEarnedData = {labels: [], datasets: []}
    this.reports = [];

    let monthsRange: DateRange[] = this.initMonths();
    this.searchRecursive(monthsRange);

  }

  public searchRecursive(monthsRange: any[]) {

    let monthRange: DateRange = monthsRange.shift();

    let sAfterDate: string = this.toolsService.formatDate(monthRange.beginDate, 'yyyy-MM-dd');
    let sBeforeDate: string = this.toolsService.formatDate(monthRange.endDate, 'yyyy-MM-dd');
    console.log("Searching for "+monthRange.beginDate+"="+sAfterDate+", "+monthRange.endDate+"="+sBeforeDate);


    this.userService.getUtilizationReportData(sAfterDate, sBeforeDate)
        .pipe(map(reportData => this.mapEngineers(reportData, monthRange)))
        .subscribe(reportDataEnhanced => this.callAndFillTimesheets(reportDataEnhanced, monthsRange, monthRange));
  }

  private callAndFillTimesheets(reportData:MonthlyUserReport[], monthsRange:DateRange[], monthRange: DateRange):void {
    console.log('callAndFillTimesheets '+reportData.length);

    let sAfterDate: string = this.toolsService.formatDate(monthRange.beginDate, 'yyyy-MM-dd');
    let sBeforeDate: string = this.toolsService.formatDate(monthRange.endDate, 'yyyy-MM-dd');

    this.timesheetService.getByDates(sAfterDate, sBeforeDate)
      .subscribe( timesheets => this.fillTimesheets(timesheets, reportData, monthsRange) );
  }

  private mapEngineers(reportData: MonthlyUserReport[], monthRange: DateRange): MonthlyUserReport[] {
    console.log("Got " + reportData.length + " reports!");

    if (reportData && reportData.length > 0) {
      for (let report of reportData) {
        report.dateRange = monthRange;
        report.office = this.dictService.getOffice(report.officeCode);
        report.role = [];
        for(let roleCode of report.roleCode) {
          console.log('debug role '+roleCode+'  '+JSON.stringify(report.roleCode)+ ' d:'+this.dictService.getRole(roleCode));
          report.role.push(this.dictService.getRole(roleCode));
        }
        report.declaredTime = 0;
      }
    } else {
      this.alertService.warn("Nie znaleziono inżynierów!");
    }

    console.log("example " + JSON.stringify(reportData[0]) + " reports!");
    return reportData;
  }

  private fillTimesheets(timesheets:Timesheet[], reportData: MonthlyUserReport[], monthsRange: any[]):void {
    if (timesheets && timesheets.length > 0) {
      for (let t of timesheets) {
        inner: for (let report of reportData) {
          if (report.id === t.personId) {
            report.declaredTime += t.usedTime;
            break inner;
          }
        }
      }

      for (let report of reportData) {
        this.calculateUtilization(report);
      }
    } else {
      this.alertService.warn("Nie znaleziono timesheetów w tym zakresie dat!");
    }

    console.log('Adding completed '+reportData.length+' reports for '+this.toolsService.formatDate(reportData[0].dateRange.beginDate, 'yyyy-MM'));
    for (let report of reportData) {
      this.reports.push(report);
    }

    if (monthsRange.length > 0) {
      this.searchRecursive(monthsRange);
    } else {
      this.calculateLineCharts(this.reports);
      this.reports = JSON.parse(JSON.stringify(this.reports));
    }
  }

  private calculateLineCharts(reports:MonthlyUserReport[]):void {

    this.chartsReady = false;

    this.lineUtilizationData.datasets = [];
    this.lineEarnedData.datasets = [];
    this.avgUtilizationData.datasets = [];
    this.totalEarnedData.datasets = [];


    let users: string[] = this.getUsers(reports);
    console.log('all users '+users.length);
    users = users.filter(user => this.filterDeselected(user));
    console.log('got '+users.length+' users');

    for(let user of users) {
      this.lineUtilizationData.datasets.push({label: user, data: JSON.parse(JSON.stringify(this.emptyData)), fill: false});
      this.lineEarnedData.datasets.push({label: user, data: JSON.parse(JSON.stringify(this.emptyData)), fill: false});
    }

    for (let report of reports) {
      let xLabel: string = this.toolsService.formatDate(report.dateRange.beginDate, 'yyyy-MM');
      let index: number = this.getLabelIndex(this.lineUtilizationData, xLabel);
      if (index >= 0) {
        for (let dataset of this.lineUtilizationData.datasets) {
          if (dataset.label === this.getUserLabel(report)) {
            dataset.data[index] = report.timeUtilizationPercentage;
            report.id < this.colors.length ? dataset.borderColor = this.colors[report.id] : dataset.borderColor = '#0000FF';
          }
        }
        for (let dataset of this.lineEarnedData.datasets) {
          if (dataset.label === this.getUserLabel(report)) {
            dataset.data[index] = report.earnedMoney;
            report.id < this.colors.length ? dataset.borderColor = this.colors[report.id] : dataset.borderColor = '#0000FF';
          }
        }
      } else {
        console.error('Not found label '+xLabel+'!');
      }
    }

    let utilizationAvg: number[] = JSON.parse(JSON.stringify(this.emptyData));
    for (let dataset of this.lineUtilizationData.datasets) {
      for (let i=0; i< dataset.data.length; i++) {
        utilizationAvg[i] += (dataset.data[i] / this.lineUtilizationData.datasets.length) ;
      }
    }
    this.avgUtilizationData.datasets.push({label: 'ŚREDNIA', data: utilizationAvg, fill: false, borderColor: '#0000FF'});

    let earnedAvg: number[] = JSON.parse(JSON.stringify(this.emptyData));
    for (let dataset of this.lineEarnedData.datasets) {
      for (let i=0; i< dataset.data.length; i++) {
        earnedAvg[i] += dataset.data[i];
      }
    }
    this.totalEarnedData.datasets.push({label: 'RAZEM', data: earnedAvg, fill: false, borderColor: '#00FF00'});


    this.lineUtilizationData = JSON.parse(JSON.stringify(this.lineUtilizationData));
    this.avgUtilizationData = JSON.parse(JSON.stringify(this.avgUtilizationData));
    this.lineEarnedData = JSON.parse(JSON.stringify(this.lineEarnedData));
    this.totalEarnedData = JSON.parse(JSON.stringify(this.totalEarnedData));
    this.chartsReady = true;
  }

  private filterDeselected(user:string):boolean {
    if (!this.selectedReports || this.selectedReports.length < 1) {
      return true;
    }

    for(let report of this.selectedReports) {
      if(user === this.getUserLabel(report)) {
        return true;
      }
    }

    return false;
  }

  private getUserLabel(report:MonthlyUserReport): string {
      return report.firstName+' '+report.lastName;
  }

  private getUsers(reports:MonthlyUserReport[]) {
    let users: string[] = [];
    for (let report of reports) {
      let username: string = this.getUserLabel(report);
      if (users.indexOf(username) === -1) {
        users.push(username);
      }
    }
    return users;
  }

  private calculateUtilization(userData: MonthlyUserReport): void {
    if (userData.workOrders && userData.workOrders.length > 0) {
      userData.expectedTime = 0;
      userData.noOrdersDone = 0;

      for (let order of userData.workOrders) {
        order.status = this.dictService.getWorkStatus(order.statusCode);

        if (order.doneDate) {
          userData.expectedTime += this.getEffort(userData.officeCode, order);
          userData.noOrdersDone++;
        } else {
          console.log("Order "+order.workNo +" has not been completed yet, thus is not taken into account!");
        }
      }


      if (userData.declaredTime === 0) {
        this.alertService.warn("Nie wypełnione deklaracje czasu pracy dla " + userData.firstName + " " + userData.lastName);
        userData.timeUtilizationPercentage = this.noTimesheets;
        this.setMark(userData);
      } else {
        let utilization: number = Math.round(((100 * userData.expectedTime) / userData.declaredTime));
        userData.timeUtilizationPercentage = utilization;
        this.setMark(userData);
      }


    } else if (!userData.declaredTime || userData.declaredTime === 0) {
      userData.timeUtilizationPercentage = this.holidays; //holidays
      this.setMark(userData);
      userData.expectedTime = 0;
      userData.noOrdersDone = 0;
    } else {
      userData.timeUtilizationPercentage = 0; //nothing done
      this.setMark(userData);
      userData.expectedTime = 0;
      userData.noOrdersDone = 0;
    }

  }

  private getEffort(officeCode: string, order: Order): number {
    if (order.typeCode === '13.0') {
      console.log('Ignore complexity of order '+order.workNo);
      return 0;
    }

    if (order.complexity != null) {
      return order.complexity;
    } else {

      for(let workType of this.workTypes) {
        if (workType.complexityCode === order.complexityCode && workType.typeCode === order.typeCode && workType.officeCode === officeCode) {
          this.alertService.warn('Brak wyceny dla '+order.workNo+ ' zastosowano wycenę z parametryzacji '+workType.complexity);
          return workType.complexity;
        }
      }
      this.alertService.error("Nie można wyliczyć raportu - nie znaleziono w bazie wyceny dla zadania o parametrach "+officeCode+","+order.typeCode+","+order.complexityCode);
      return 0;
    }
  }


  private setMark(userData: MonthlyUserReport): void {
    let utilization: number = userData.timeUtilizationPercentage;
    if (utilization > 100) {
      this.setIcon(userData, "fa fa-trophy", "green");
    } else if (utilization >= 80) {
      this.setIcon(userData, "fa fa-thumbs-up", "green");
    } else if (utilization > 40 && utilization < 80) {
      this.setIcon(userData, "fa fa-bell", "orange");
    } else if (utilization > 0) {
      this.setIcon(userData, "fa fa-thumbs-down", "red");
    } else if (utilization == 0) {
      this.setIcon(userData, "fa fa-exclamation", "#902828");
    } else if (utilization == this.holidays) {
      this.setIcon(userData, "fa fa-hotel", "grey");
    } else if (utilization == this.noTimesheets) {
      this.setIcon(userData, "fa fa-question-circle", "darkgrey");
    }

    let pLabel: string = userData.lastName+'_'+this.toolsService.formatDate(userData.dateRange.beginDate, 'yyyy-MM');
    console.log('Processing report pLabel='+pLabel);

    userData.earnedMoney = 0;
    for(let order of userData.workOrders) {
      if (order.doneDate) {
        let doneDate: Date = this.toolsService.parseDate(order.doneDate);
        console.log('debug '+doneDate+', '+userData.dateRange.beginDate+' _ '+JSON.stringify(userData));
        if (userData.dateRange && userData.dateRange.beginDate && userData.dateRange.endDate && userData.dateRange.beginDate.getTime() <= doneDate.getTime() && doneDate.getTime() <= userData.dateRange.endDate.getTime()) {
          userData.earnedMoney += order.price;
        }
      }
    }

  }

  private setIcon(userData: MonthlyUserReport, icon: string, iconColor: string): void {
    userData.icon = icon;
    userData.iconColor = iconColor;
  }

  private isReportSelected(id:number, selectedReports:MonthlyUserReport[]):boolean {
    for(let selectedReport of selectedReports) {
      if (selectedReport.id === id) {
        return true;
      }
    }
    return false;
  }

  private getLabelIndex(lineData: any, xLabel: string): number {
    for(let i=0; i < lineData.labels.length; i++) {
      if (lineData.labels[i] === xLabel) {
        return i;
      }
    }
    return -1;
  }
}



