import { Component, OnInit } from '@angular/core';

import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';


@Component({
    selector: 'app-timesheets',
    templateUrl: './timesheets.component.html',
    styleUrls: ['./timesheets.component.css']
})
export class TimesheetsComponent implements OnInit {

    engineers:User[];
    engineersWithSheets:UserWithSheet[] = <UserWithSheet[]> [];
    emptySheet: number = -1;
    sEmptySheet: string = "BRAK";
    warns: string[];

    afterDate:Date;
    beforeDate:Date;
    displayConfirmationDialog:boolean;

    constructor(private userService:UserService,
                private timesheetService:TimesheetService,
                private dictService:DictService,
                private alertService:AlertService,
                private toolsService:ToolsService) {

        this.afterDate = toolsService.getCurrentDateDayOperation(-1);
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
        this.dictService.init();
    }

    ngOnInit() {
        this.search();
    }

    onEditInit(event) {
        console.log("edit !" + JSON.stringify(event));
        if (event.data.timesheetUsedTime === this.sEmptySheet) {
            event.data.timesheetUsedTime = "";
        }
    }

    search() {
        let sAfterDate: string = this.afterDate.toISOString().substring(0, 10);
        let sBeforeDate: string = this.beforeDate.toISOString().substring(0, 10);
        console.log("Searching for "+this.afterDate+"="+sAfterDate+", "+this.beforeDate+"="+sBeforeDate);

        this.userService.getEngineers()
            .mergeMap(engineers => this.callTimesheets(engineers, sAfterDate, sBeforeDate))
            .subscribe(timesheets => this.combine(timesheets, this.engineers));
    }

    private callTimesheets(engineers: User[], after:string, before:string):Observable<Timesheet[]> {
        console.log("Got "+engineers.length+" engineers!");
        this.engineers = engineers;
        return this.timesheetService.getByDates(after, before);
    }

    private getUsedTimeAsString(usedTime: number) {
        return ""+(usedTime !== this.emptySheet? usedTime : this.sEmptySheet);
    }

    private combine(timesheets:Timesheet[], engineers:User[]):void {
        console.log("combine "+JSON.stringify(timesheets) +"\n"+JSON.stringify(engineers));

        if (engineers && engineers.length > 0) {
            this.engineersWithSheets = [];
            let d: Date = new Date(this.afterDate.getTime());
            while (d <= this.beforeDate) {
                let sDate: string = d.toISOString().substring(0, 10);
                console.log("interating over date "+sDate);
                this.calculateTimesheetsForDate(engineers, sDate, timesheets);
                d.setDate(d.getDate() + 1);
            }
        } else {
            this.alertService.error("Bląd systemu - nie znaleziono inżynierów");
        }


    }

    private calculateTimesheetsForDate(engineers, sDate, timesheets) {
        for (let engineer of engineers) {
            let engineerWithSheet:UserWithSheet = <UserWithSheet> JSON.parse(JSON.stringify(engineer));
            engineerWithSheet.tabid = this.engineersWithSheets.length;
            console.log("interating over engineer " + engineerWithSheet.email);

            //create with default values
            engineerWithSheet.timesheet = new Timesheet(engineer.id, sDate, this.emptySheet);
            engineerWithSheet.timesheetUsedTime = this.getUsedTimeAsString(engineerWithSheet.timesheet.usedTime);
            engineerWithSheet.timesheetWorkDate = engineerWithSheet.timesheet.workDate;

            //update with backend values if exist
            this.updateTimesheetWithBackendValues(timesheets, engineerWithSheet, sDate);

            console.log("pushing " + JSON.stringify(engineerWithSheet));
            this.engineersWithSheets.push(engineerWithSheet);
        }
    }

    private updateTimesheetWithBackendValues(timesheets, engineerWithSheet, sDate) {
        if (timesheets && timesheets.length > 0) {
            for (let timesheet of timesheets) {
                if (timesheet.personId === engineerWithSheet.id && timesheet.workDate === sDate) {
                    console.log("Found timesheet for " + engineerWithSheet.email + " and date=" + sDate + " with usedTime=" + timesheet.usedTime);
                    engineerWithSheet.timesheet = timesheet;
                    engineerWithSheet.timesheetUsedTime = this.getUsedTimeAsString(timesheet.usedTime);
                    engineerWithSheet.timesheetWorkDate = timesheet.workDate;

                }
            }
        }
    }

    engineerWithChangedSheet: UserWithSheet[];

    private warn(msg: string): void {
        this.alertService.warn(msg);
        this.warns.push(msg);
    }

    showConfirmDialog():void {
        this.warns = [];
        this.engineerWithChangedSheet = <UserWithSheet[]> [];
        for (let engineerWithSheet of this.engineersWithSheets){
            if (engineerWithSheet.timesheetUsedTime !== this.sEmptySheet) {

                console.log("about to formUsedTime for "+engineerWithSheet.timesheetUsedTime);
                let formUsedTime: number = Number(engineerWithSheet.timesheetUsedTime);
                console.log("formUsedTime "+formUsedTime);
                if (formUsedTime === undefined || formUsedTime == null ) {
                    this.warn("Nie dodano raportu dla " + engineerWithSheet.email + " ze względu na brak wartości");
                } else if (isNaN(formUsedTime) || formUsedTime < 0 || formUsedTime > 24) {
                    this.warn("Nie dodano raportu dla " + engineerWithSheet.email + " ze względu na wartość "+engineerWithSheet.timesheetUsedTime+" spoza zakresu 0-24!");
                } else {
                    if (engineerWithSheet.timesheet.usedTime != formUsedTime) { //value has changed
                        console.log("Zmieniam deklaracje godzin dla "+engineerWithSheet.firstName+" "+engineerWithSheet.lastName);
                        engineerWithSheet.timesheet.usedTime = formUsedTime;
                        this.engineerWithChangedSheet.push(engineerWithSheet);
                    }
                }

            }
        }

        this.displayConfirmationDialog = true;
    }

    saveSheets(): void {
        this.displayConfirmationDialog = false;

        let timesheetsToUpdate: Timesheet[] = [];
        for (let engineer of this.engineerWithChangedSheet) {
            timesheetsToUpdate.push(engineer.timesheet);
        }

        this.timesheetService.upsert(timesheetsToUpdate)
            .subscribe(created => this.alertService.success("Pomyślnie wprowadzono "+timesheetsToUpdate.length+" deklaracji czasu pracy."));

    }
}


export class UserWithSheet extends User {
    tabid: number;
    timesheet: Timesheet;
    timesheetUsedTime: string; //flat property for p-dataTable
    timesheetWorkDate: string; //flat property for p-dataTable
}

