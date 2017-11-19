import { Component, OnInit } from '@angular/core';

import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';


export class UserWithSheet extends User {
    timesheet: Timesheet;
    timesheetUsedTime: number; //flat property for p-dataTable
}

@Component({
    selector: 'app-timesheets',
    templateUrl: './timesheets.component.html',
    styleUrls: ['./timesheets.component.css']
})
export class TimesheetsComponent implements OnInit {

    engineers:User[];
    engineersWithSheets:UserWithSheet[] = <UserWithSheet[]> [];
    emptySheet: number = -1;

    reportDate:Date;
    displayConfirmationDialog:boolean;

    constructor(private userService:UserService,
                private timesheetService:TimesheetService,
                private dictService:DictService,
                private alertService:AlertService,
                private toolsService:ToolsService) {

        this.reportDate = toolsService.getCurrentDateDayOperation(-1);
        this.dictService.init();
    }

    ngOnInit() {
        this.search();
    }

    testSelect(value:any) {
        console.log("Date has been selected"+JSON.stringify(value));
    }

    search() {
        let sReportDate: string = this.reportDate.toISOString().substring(0, 10);
        console.log("Searching for "+this.reportDate+"="+sReportDate);

        this.userService.getEngineers()
            .mergeMap(engineers => this.callTimesheets(engineers, sReportDate, sReportDate))
            .subscribe(timesheets => this.combine(timesheets, this.engineers));
    }

    private callTimesheets(engineers: User[], after:string, before:string):Observable<Timesheet[]> {
        console.log("Got "+engineers.length+" engineers!");
        this.engineers = engineers;
        return this.timesheetService.getByDates(after, before);
    }

    private combine(timesheets:Timesheet[], engineers:User[]):void {
        console.log("combine "+JSON.stringify(timesheets) +"\n"+JSON.stringify(engineers));

        this.engineersWithSheets = [];
        if (engineers && engineers.length > 0 && timesheets) {

            for (let engineer of engineers) {
                let engineerWithSheet : UserWithSheet = <UserWithSheet> engineer;
                engineerWithSheet.timesheet = new Timesheet(engineer.id, this.reportDate.toISOString().substring(0, 10), this.emptySheet);
                engineerWithSheet.timesheetUsedTime = this.emptySheet;
                for (let timesheet of timesheets) {
                    if (timesheet.personId === engineerWithSheet.id) {
                        engineerWithSheet.timesheet = timesheet;
                        if (timesheet.workDate === undefined) {
                            timesheet.workDate = this.reportDate.toISOString().substring(0, 10);
                        }
                        engineerWithSheet.timesheetUsedTime = timesheet.usedTime;
                    }
                }
                this.engineersWithSheets.push(engineerWithSheet);
            }
        } else {
            this.alertService.error("Bląd systemu - brak inżynierów");
        }
    }

    showConfirmDialog():void {
        this.displayConfirmationDialog = true;
    }

    saveSheets(): void {
        let timesheetsToAdd: Timesheet[] = [];
        let timesheetsToUpdate: Timesheet[] = [];

        for (let engineerWithSheet of this.engineersWithSheets){
            if (engineerWithSheet.timesheet.usedTime != engineerWithSheet.timesheetUsedTime) { //value has changed
                console.log("Zmieniam deklaracje godzin dla "+engineerWithSheet.firstName+" "+engineerWithSheet.lastName);
                engineerWithSheet.timesheet.usedTime = engineerWithSheet.timesheetUsedTime;
                timesheetsToUpdate.push(engineerWithSheet.timesheet);
            }
        }

        this.timesheetService.update(timesheetsToUpdate).subscribe(
            updated => this.add(updated, timesheetsToAdd)
        );
        this.displayConfirmationDialog = false;

    }

    private add(updated:any, timesheetsToUpdate:Timesheet[]):void {
        this.timesheetService.add(timesheetsToUpdate).subscribe(
                updated => this.alertService.success("Pomyślnie zaktualizowano obecności na dzień "+this.reportDate.toISOString().substring(0, 10))
        );
    }
}

