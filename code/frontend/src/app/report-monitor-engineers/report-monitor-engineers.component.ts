import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';



import { User, UserReport, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';
import { Calendar } from '../_models/calendar';

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
    future: string;

    reports: UserReport[];
    selectedReport: UserReport;
    selectedReports: UserReport[];
    doneOrdersDialogDisplay: boolean;

    //scheduler
    schedulerDisplay:boolean;
    schedulerEvents: any[];
    schedulerHeader: any;

    selectedOrder: Order;
    orderDialogDisplay:boolean;

    workTypes: WorkType[];

    chartUtilizationData: any;
    chartShareData: any;
    chartEarnedData: any;
    chartsReady: boolean;
    pl: Calendar;
    cols: any;
    colsForOrdersTable: any;

    constructor(private woService:WOService,
                private userService:UserService,
                private workTypeService:WorkTypeService,
                private dictService:DictService,
                private alertService:AlertService,
                public toolsService:ToolsService,
                private timesheetService: TimesheetService) {

        this.dictService.init();
        this.workTypeService.init();

        let d = new Date();
        d.setMonth(d.getMonth() - 1);
        this.afterDate = d;
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
        this.future = toolsService.formatDate(toolsService.getCurrentDateDayOperation(+10), 'yyyy-MM-dd');
        this.pl=new Calendar();

    }

    ngOnInit() {

        this.workTypeService.getAllWorkTypes().subscribe(workTypes => this.workTypes = workTypes);

        this.schedulerHeader = {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        };


        this.search();

        this.cols = [
            { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-10 col-icon", check:true},            
            { field: 'id', header: 'Id',hidden:true, sortable: true, filter:true},
            { field: 'none', header: 'Ocena' ,excludeGlobalFilter: true,  class:"width-10 text-center", icon: true},
            { field: 'timeUtilizationPercentage', header: 'Wydajność', sortable:true, filter:true, class:"width-50 text-center", utilization:true, icon:true},
            { field: 'firstName', header: 'Imię',sortable:true, filter:true,class:"width-35 text-center"},
            { field: 'lastName', header: 'Nazwisko', sortable:true, filter:true, class:"width-35 text-center" },
            { field: 'role', header: 'Rola', sortable:true , filter:true, class:"width-35 text-center"},
            { field: 'office', header: 'Biuro' , sortable:true, filter:true, class:"width-50 text-center"},
            { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-20 text-center", isFromPool:true, icon:true},
            { field: 'declaredTime', header: 'Czas zadeklarowany', sortable:true , class:"width-35 text-center", declaredTime:true, icon:true},  
            { field: 'expectedTime', header: 'Czas zakładany', sortable:true , class:"width-35 text-center",expectedTime:true, icon:true},  
            { field: 'noOrdersDone', header: 'Ukończonych WO', sortable:true , class:"width-35 text-center"},  
            { field: 'earnedMoney', header: 'Wypracowany obrót', sortable:true , class:"width-35 text-center",earnedMoney:true, icon:true},
            { field: 'none', header: 'Zlecenia', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-35 col-icon text-center", icon:true, orders:true},  
          ]
        this.colsForOrdersTable = [                    
            { field: 'workNo', header: 'Zlecenie' ,filter:true, sortable:true, class:"width-35"},
            { field: 'typeCode', header: 'Typ', sortable:true, filter:true, class:"width-50 text-center", typeCode:true, icon:true},
            { field: 'status', header: 'Status',sortable:true, filter:true,class:"width-50 text-center", status:true, icon:true},
            { field: 'complexityCode', header: 'Zł.', sortable:true, class:"width-20 text-center", complexity:true, icon:true },
            { field: 'complexity', header: 'Wycena [H]', sortable:true , class:"width-35 text-center"},
            { field: 'price', header: 'Cena' , sortable:true, filter:true, class:"width-35 text-center"},
            { field: 'sharedPrice', header: 'Obrót',sortable:true , filter:true, class:"width-35 text-center"},
            { field: 'assignedDate', header: 'Przypisano', sortable:true ,filter:true, class:"width-35 text-center"},  
            { field: 'doneDate', header: 'Zrealizowano', sortable:true ,filter:true, class:"width-35 text-center"},       
            { field: 'none', header: '', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-35 col-icon text-center", icon:true, order:true},  
        ]
    }



    onRowDblclick(event) {
        console.log(event);
        console.log("double clicked "+JSON.stringify(event));
        this.prepareAndShowCalendar(event);
    }

    prepareAndShowCalendar(report: UserReport) {
        this.selectedReport = report;

        this.schedulerEvents = [];
        if (this.selectedReport.workOrders && this.selectedReport.workOrders.length > 0) {
            for(let order of this.selectedReport.workOrders) {
                let event: any = {};

                event.start = order.assignedDate;
                event.orderId = order.id;
                event.color = this.workTypeService.getWorkTypeColor(order); //this.toolsService.getOrderColor(order.typeCode);

                if (order.doneDate) {
                    event.title = order.workNo;
                    event.end = order.doneDate;
                    event.borderColor = "green";
                    event.textColor = "black";
                } else {
                    event.title = order.workNo+"...";
                    event.end = this.future;
                    event.borderColor = "orange";
                    event.textColor = "#29293d";
                }

                console.log(event.title + "doneDate = "+order.doneDate + " => event.end = "+event.end +", event.start="+event.start);

                this.schedulerEvents.push(event);
            }

            this.schedulerDisplay = true;
        } else {
            this.alertService.info("Nie ma żadnych prac do pokazania dla "+this.selectedReport.firstName+ " "+this.selectedReport.lastName);
        }
    }

    handleOrderClick(e: any) {
        console.log("order clicked title:"+e.calEvent.title);
        console.log("order clicked orderId:"+e.calEvent.orderId);

        /*
        var cache = [];
        console.log("order event :"+JSON.stringify(e.calEvent.event, function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Duplicate reference found
                    try {
                        // If this value does not reference a parent it can be deduped
                        return JSON.parse(JSON.stringify(value));
                    } catch (error) {
                        // discard key if value cannot be deduped
                        return;
                    }
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        }));
        cache = null;
        */


        this.getAndShowOrderDetails(e.calEvent.orderId);
    }

    private getAndShowOrderDetails(orderId: number) {
        loop: for(let order of this.selectedReport.workOrders) {
            if (order.id === orderId) {
                //ambigous since 12.2017 this.woService.getOrdersByWorkNo(order.workNo).subscribe(order => this.showOrder(order));
                this.woService.getOrderById(order.id).subscribe(order => this.showOrder(order));
                break loop;
            }
        }
    }

    private showOrder(order:Order):void {
        console.log(JSON.stringify(order));
        this.selectedOrder = order;

        for (let o of this.selectedReport.workOrders) {
            if (o.id === this.selectedOrder.id) {
                this.selectedOrder.assignedDate = o.assignedDate;
                this.selectedOrder.doneDate = o.doneDate;
            }
        }

        console.log("show "+JSON.stringify(this.selectedOrder));
        this.orderDialogDisplay = true;
    }

    search(): void {
        let sAfterDate: string = this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd');
        let sBeforeDate: string = this.toolsService.formatDate(this.beforeDate, 'yyyy-MM-dd');
        console.log("Searching for "+this.afterDate+"="+sAfterDate+", "+this.beforeDate+"="+sBeforeDate);

        this.chartsReady = false;
        this.chartUtilizationData = {labels: ['Wydajność %'], datasets: []};
        this.chartEarnedData = {labels: ['Wypracowany obrót'], datasets: []};
        this.chartShareData = {labels: [], datasets: [{data: [], backgroundColor: []}]};
        this.reports = [];

        this.userService.getUtilizationReportData(sAfterDate, sBeforeDate)
            .pipe(mergeMap(reportData => this.mapEngineersCallTimesheets(reportData, sAfterDate, sBeforeDate)))
            .subscribe(timesheets => this.fillTimesheets(timesheets));
    }

    private calculateLineCharts(): void {
        this.chartsReady = false;
        this.chartUtilizationData = {labels: ['Wydajność %'], datasets: []};
        this.chartEarnedData = {labels: ['Wypracowany obrót'], datasets: []};
        this.chartShareData = {labels: [], datasets: [{data: [], backgroundColor: []}]};

        this.calculateUtilizationForAll(this.reports);
    }

    public showDoneOrders(event, report: UserReport) {
        this.selectedReport = report;
        this.doneOrdersDialogDisplay=true;
    }

    private mapEngineersCallTimesheets(reportData: UserReport[], after:string, before:string):Observable<Timesheet[]> {
        console.log("Got " + reportData.length + " reports!");

        if (reportData && reportData.length > 0) {
            for (let report of reportData) {            
                    report.office = this.dictService.getOffice(report.officeCode);
                    report.role = [];
                    for (let roleCode of report.roleCode) {
                        report.role.push(this.dictService.getRole(roleCode));
                    }
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
                    if (report.id === t.personId && t.isLeave !== 'Y') {
                        report.declaredTime += t.usedTime;
                        break inner;
                    }
                }
            }

            this.calculateUtilizationForAll(this.reports);
        } else {
            this.alertService.warn("Nie znaleziono timesheetów w tym zakresie dat!");
        }
    }

    private calculateUtilizationForAll(reports: UserReport[]) {
        for (let report of reports) {
            this.calculateUtilization(report);
        }
        //console.log("all done: "+JSON.stringify(reports));
        //console.log("all done: "+JSON.stringify(this.chartUtilizationData));
        //console.log("all done: "+JSON.stringify(this.chartShareData));

        this.chartsReady = true;
    }

    
    private calculateUtilization(userData: UserReport): void {
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
                this.setMark(userData, this.noTimesheets);
                userData.timeUtilizationPercentage = this.noTimesheets;
            } else {
                let utilization: number = Math.round(((100 * userData.expectedTime) / userData.declaredTime));
                userData.timeUtilizationPercentage = utilization;
                this.setMark(userData, utilization);
            }


        } else if (!userData.declaredTime || userData.declaredTime === 0) {
            userData.timeUtilizationPercentage = this.holidays; //holidays
            userData.expectedTime = 0;
            this.setMark(userData, this.holidays);
            userData.noOrdersDone = 0;
        } else {
            userData.timeUtilizationPercentage = 0; //nothing done
            this.setMark(userData, 0);
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


    private setMark(userData: UserReport, utilization: number): void {
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

        if (!this.selectedReports || this.selectedReports.length < 1 || this.isReportSelected(userData.id, this.selectedReports)) {
            if (utilization != this.holidays && utilization != this.noTimesheets) {
                this.chartUtilizationData.datasets.push({label: userData.lastName, backgroundColor: userData.iconColor, borderColor:userData.iconColor, data: [utilization] });
            }

            if (userData.expectedTime > 0) {
                this.chartShareData.datasets[0].data.push(userData.expectedTime);
                this.chartShareData.datasets[0].backgroundColor.push(userData.iconColor);
                this.chartShareData.labels.push(userData.firstName + " " + userData.lastName);
            }

            {
                userData.earnedMoney = 0;
                for(let order of userData.workOrders) {
                    if (order.doneDate) {
                        let doneDate: Date = this.toolsService.parseDate(order.doneDate);
                        doneDate.setHours(0,0,0,0);
                        if (this.afterDate.getTime() <= doneDate.getTime() && doneDate.getTime() <= this.beforeDate.getTime()) {
                            userData.earnedMoney += order.sharedPrice;
                        } else {
                            console.log("earnedMoney without : "+doneDate +" as it is not after "+this.afterDate+ " or before "+this.beforeDate);
                        }
                    }
                }
                this.chartEarnedData.datasets.push({label: userData.lastName, backgroundColor: userData.iconColor, borderColor:userData.iconColor, data: [userData.earnedMoney] });
            }
        }

    }

    holidays: number = -1;
    noTimesheets: number = -2;

    private setIcon(userData: UserReport, icon: string, iconColor: string): void {
        userData.icon = icon;
        userData.iconColor = iconColor;
    }

    private isReportSelected(id:number, selectedReports:UserReport[]):boolean {
        for(let selectedReport of selectedReports) {
            if (selectedReport.id === id) {
                return true;
            }
        }
        return false;
    }


    public getAvgMoney():number {
        if (this.chartsReady && this.chartEarnedData.datasets && this.chartEarnedData.datasets.length > 0) {
            let result: number = 0;
            for(let dataset of this.chartEarnedData.datasets) {
                result += +dataset.data[0];
            }
            return result/this.chartEarnedData.datasets.length;
        }
        return -1;
    }

    public getAvgUtilization(): number {
        if (this.chartsReady && this.chartUtilizationData.datasets && this.chartUtilizationData.datasets.length > 0) {
            let result: number = 0;
            for(let dataset of this.chartUtilizationData.datasets) {
                result += +dataset.data[0];
            }
            return result/this.chartUtilizationData.datasets.length;
        }
        return -1;
    }

    public filterReports(event): void {
        console.log('onSelect event fired!'+JSON.stringify(event));
        if (!event.type || event.type === 'checkbox') {
            this.calculateLineCharts();
        } else {
            console.log('onSelect event fired and consumed!'+JSON.stringify(event));
        }
    }
}


