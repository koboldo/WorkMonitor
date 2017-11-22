import { Component, OnInit } from '@angular/core';

import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { User, UserReport, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';

declare var jquery:any;
declare var $ :any;

@Component({
    selector: 'app-report-monitor-engineers',
    templateUrl: './report-monitor-engineers.component.html',
    styleUrls: ['./report-monitor-engineers.component.css']
})
export class ReportMonitorEngineersComponent implements OnInit {

    /* search and selection */
    afterDate:Date;
    beforeDate:Date;

    reports: UserReport[];
    selectedReport: UserReport;

    //scheduler
    schedulerDisplay:boolean;
    schedulerEvents: any[];
    schedulerHeader: any;

    workTypes: WorkType[];

    constructor(private woService:WOService,
                private userService:UserService,
                private workService:WorkTypeService,
                private dictService:DictService,
                private alertService:AlertService,
                private toolsService:ToolsService,
                private timesheetService: TimesheetService) {

        this.dictService.init();
        this.afterDate = toolsService.getCurrentDateDayOperation(-31);
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
    }

    ngOnInit() {

        this.workService.getAllWorkTypes().subscribe(workTypes => this.workTypes = workTypes);

        this.schedulerHeader = {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        };


        this.search();
    }

    onRowSelect(event) {
        console.log("selected row!" + JSON.stringify(this.selectedReport));
        this.schedulerEvents = [];
        if (this.selectedReport.workOrders && this.selectedReport.workOrders.length > 0) {
            for(let order of this.selectedReport.workOrders) {
                let event: any = {};
                event.title = order.workNo;
                event.start = order.assignedDate;
                event.end = order.doneDate? order.doneDate: this.beforeDate.toISOString().substring(0, 10);

                this.schedulerEvents.push(event);
            }

            this.schedulerDisplay = true;
        } else {
            this.alertService.info("Nie ma żadnych prac do pokazania dla "+this.selectedReport.firstName+ " "+this.selectedReport.lastName);
        }


    }

    handleOrderClick(e: any) {
        console.log("order clicked :"+e.calEvent.title);
    }

    search() {
        let sAfterDate: string = this.afterDate.toISOString().substring(0, 10);
        let sBeforeDate: string = this.beforeDate.toISOString().substring(0, 10);
        console.log("Searching for "+this.afterDate+"="+sAfterDate+", "+this.beforeDate+"="+sBeforeDate);

        this.userService.getUtilizationReportData(sAfterDate, sBeforeDate)
            .mergeMap(reportData => this.mapEngineersCallTimesheets(reportData, sAfterDate, sBeforeDate))
            .subscribe(timesheets => this.fillTimesheets(timesheets));
    }

    private mapEngineersCallTimesheets(reportData: UserReport[], after:string, before:string):Observable<Timesheet[]> {
        console.log("Got " + reportData.length + " reports!");

        if (reportData && reportData.length > 0) {
            for (let report of reportData) {
                report.office = this.dictService.getOffice(report.officeCode);
                report.role = this.dictService.getRole(report.roleCode);
                report.declaredTime = 0;
            }
            this.reports = reportData;
        } else {
            this.alertService.warn("Nie znaleziono inżynierów!");
        }


        return this.timesheetService.getByDates(after, before);
    }

    private fillTimesheets(timesheets:Timesheet[]):void {
        if (timesheets && timesheets.length > 0) {
            for (let t of timesheets) {
                inner: for (let report of this.reports) {
                    if (report.id === t.personId) {
                        report.declaredTime += t.usedTime;
                        break inner;
                    }
                }
            }

            this.calculateUtilizationForAll(this.reports);
        } else {
            this.alertService.error("Nie znaleziono timesheetów w tym zakresie dat!");
        }
    }

    private calculateUtilizationForAll(reports: UserReport[]) {
        for (let report of reports) {
            this.calculateUtilization(report);
        }
        console.log("all done: "+JSON.stringify(reports));
    }

    private calculateUtilization(userData: UserReport): void {
        if (userData.workOrders && userData.workOrders.length > 0) {
            userData.expectedTime = 0;
            userData.noOrdersDone = 0;

            for (let order of userData.workOrders) {
                order.status = this.dictService.getWorkStatus(order.statusCode);

                if (order.doneDate) {
                    userData.expectedTime += this.getEffort(userData.officeCode, order.typeCode, order.complexityCode);
                    userData.noOrdersDone++;
                } else {
                    console.log("Order "+order.workNo +" has not been completed yet, thus is not taken into account!");
                }
            }

            if (userData.declaredTime === 0) {
                this.alertService.warn("Nie wypełnione deklaracje czasu pracy dla " + userData.firstName + " " + userData.lastName);
                userData.icon = "fa fa-question-circle";
                userData.timeUtilizationPercentage = "brak deklaracji czasu!";
            } else {
                let utilization: number = Math.round(((100 * userData.expectedTime) / userData.declaredTime));
                userData.timeUtilizationPercentage = ""+utilization+"%";
                if (utilization > 100) {
                    userData.icon = "fa fa-trophy";
                } else if (utilization >= 80) {
                    userData.icon = "fa fa-thumbs-up";
                } else if (utilization > 40 && utilization < 80) {
                    userData.icon = "fa fa-bell";
                } else {
                    userData.icon = "fa fa-thumbs-down";
                }
            }


        } else if (!userData.declaredTime || userData.declaredTime === 0) {
            userData.timeUtilizationPercentage = "nieobecność"; //holidays
            userData.expectedTime = 0;
            userData.icon = "fa fa-hotel";
            userData.noOrdersDone = 0;
        } else {
            userData.timeUtilizationPercentage = "0%"; //nothing done
            userData.icon = "fa fa-exclamation";
            userData.expectedTime = 0;
            userData.noOrdersDone = 0;
        }
    }

    private getEffort(officeCode: string, typeCode: string, complexityCode: string): number {
        for(let workType of this.workTypes) {
            if (workType.complexityCode === complexityCode && workType.typeCode === typeCode && workType.officeCode === officeCode) {
                return workType.complexity;
            }
        }
        this.alertService.error("Nie można wyliczyć raportu - nie znaleziono w bazie wyceny dla zadania o parametrach "+officeCode+","+typeCode+","+complexityCode);
        return 0;
    }

}


