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
    engineerWithChangedSheet: UserWithSheet[];
    emptySheet: number = -1;
    sEmptySheet: string = "BRAK";
    warns: string[];
    timeRegexp: RegExp =  new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');

    afterDate:Date;
    beforeDate:Date;
    displayConfirmationDialog:boolean;

    user: User;
    copy: UserWithSheet;

    constructor(private userService:UserService,
                private timesheetService:TimesheetService,
                private dictService:DictService,
                private alertService:AlertService,
                private toolsService:ToolsService,
                private authSerice:AuthenticationService) {

        this.afterDate = toolsService.getCurrentDateDayOperation(-1);
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
        this.dictService.init();
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.user = user);
        this.search();
    }


    onEditInit(event) {
        console.log("about edit !" + JSON.stringify(event));

        if (event.data.timesheetFrom !== "" && event.data.timesheetTo != "") {
            this.copy = JSON.parse(JSON.stringify(event.data));
        }

        if (event.data.timesheetFrom === this.sEmptySheet && event.data.timesheetTo === this.sEmptySheet) {
            //cleaning BRAK values
            event.data.timesheetFrom = "";
            event.data.timesheetTo = "";
        }
    }

    onEditCancel(event) {
        this.onEditComplete(event);
    }

    onEditComplete(event) {
        console.log("edited !" + JSON.stringify(event));
        if (event.data.timesheetFrom && event.data.timesheetFrom!== this.sEmptySheet && !this.timeRegexp.test(event.data.timesheetFrom)) {
            this.alertService.warn("Nie zmieniono deklaracji ze względu na nieprawidlową wartość: "+event.data.timesheetFrom);
            this.onEditCancel(event);
        }

        if (event.data.timesheetTo && event.data.timesheetTo!== this.sEmptySheet && !this.timeRegexp.test(event.data.timesheetTo)) {
            this.alertService.warn("Nie zmieniono deklaracji ze względu na nieprawidlową wartość: "+event.data.timesheetTo);
            this.onEditCancel(event);
        }

        if (event.data.timesheetFrom && this.timeRegexp.test(event.data.timesheetFrom) && event.data.timesheetTo && this.timeRegexp.test(event.data.timesheetTo)) {
            let workTime: number = this.calculateWorkTime(event.data.timesheetWorkDate, event.data.timesheetFrom, event.data.timesheetTo, event.data.timesheetBreakInMinutes);
            if (workTime >= 0) {
                event.data.timesheetUsedTime = ""+workTime;
            } else {
                this.alertService.warn("Nie zmieniono deklaracji ze względu na czas pracy mniejszy niż zero!");
                event.data.timesheetFrom = this.copy.timesheetFrom;
                event.data.timesheetTo = this.copy.timesheetTo;
                event.data.timesheetUsedTime = this.copy.timesheetUsedTime;
                event.data.timesheetBreakInMinutes = this.copy.timesheetBreakInMinutes;
            }
        } else {
            console.log("Prawdopodobnie nie skonczono wypelniac timesheet "+JSON.stringify(event.data));
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

            engineerWithSheet.timesheetFrom = this.sEmptySheet;
            engineerWithSheet.timesheetTo = this.sEmptySheet;
            engineerWithSheet.timesheetBreakInMinutes = 0;


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

                    //Todo remove backend mock
                    engineerWithSheet.timesheetFrom = timesheet.from;
                    engineerWithSheet.timesheetTo = timesheet.to;
                    engineerWithSheet.timesheetBreakInMinutes = timesheet.breakInMinutes;

                }
            }
        }
    }


    private warn(msg: string): void {
        this.alertService.warn(msg);
        this.warns.push(msg);
    }

    private calculateWorkTime(workDate: string, from: string, to: string, workBreakMinutes: number): number {
        if (from.indexOf(":") > -1 && to.indexOf(":") > -1) {


            let dateFrom: number = this.toolsService.parseDate(workDate+ " "+ from + ":00" ).getTime();
            let dateTo: number = this.toolsService.parseDate(workDate+ " "+ to + ":00" ).getTime();
            let diffMillis: number = dateTo - dateFrom;

            let workHours: number = ((diffMillis / 3600) - (1000*workBreakMinutes/60))/1000 - 0.25; //-15min
            console.log("For from="+from +" to=" +to +" interval="+workHours);

            if (workHours < 0 || workHours > 24) {
                console.log("1000xHours "+((diffMillis / 3600) +" breaks "+((1000*workBreakMinutes/60))/1000 + 0.25));
                return -1;
            }

            return Math.round(workHours*10)/10;

        }
        return -1;
    }

    showConfirmDialog():void {
        this.warns = [];
        this.engineerWithChangedSheet = <UserWithSheet[]> [];
        for (let engineerWithSheet of this.engineersWithSheets){
            let usedTime: number = Number(engineerWithSheet.timesheetUsedTime);
            if (engineerWithSheet.timesheetUsedTime !== this.sEmptySheet && !isNaN(usedTime)) {

                if (engineerWithSheet.timesheet.usedTime != usedTime) { //value has changed
                    let copy: UserWithSheet = JSON.parse(JSON.stringify(engineerWithSheet));

                    console.log("Zmieniam deklaracje godzin dla "+engineerWithSheet.firstName+" "+engineerWithSheet.lastName);
                    copy.timesheet.usedTime = usedTime;
                    copy.timesheet.breakInMinutes = engineerWithSheet.timesheetBreakInMinutes;
                    copy.timesheet.from = this.toolsService.parseDate(engineerWithSheet.timesheetWorkDate+ " "+ engineerWithSheet.timesheetFrom + ":00" ).getTime();
                    copy.timesheet.to = this.toolsService.parseDate(engineerWithSheet.timesheetWorkDate+ " "+ engineerWithSheet.timesheetTo + ":00" ).getTime();
                    this.engineerWithChangedSheet.push(copy);
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
    timesheetFrom: string;
    timesheetTo: string;
    timesheetBreakInMinutes: number;


}

