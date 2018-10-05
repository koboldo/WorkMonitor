import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User, Timesheet } from '../_models/index';
import { TimesheetService, ToolsService, AlertService } from '../_services/index';

@Component({
    selector: 'user-attendance-register',
    templateUrl: './user-attendance-register.component.html',
    styleUrls: ['./user-attendance-register.component.css']
})
export class UserAttendanceRegisterComponent implements OnInit {

    @Input() user:User;

    @Input() entryMode:boolean;

    private timesheet: Timesheet;

    constructor(private timesheetService:TimesheetService,
                private toolsService: ToolsService,
                private alertService: AlertService) {
    }

    ngOnInit() {
        let today:Date = this.toolsService.getCurrentDateDayOperation(0);

        let sToday: string = today.toISOString().substring(0, 10);
        this.timesheetService.getByDates(sToday, sToday)
            .subscribe((timesheets:Timesheet[]) => this.findUser(timesheets));
    }

    public isSetFrom():boolean {
        return this.timesheet && this.timesheet.from && this.timesheet.from.substr(11,8) != "00:00:00";
    }

    public isSetTo():boolean {
        return this.timesheet && this.timesheet.to && this.timesheet.to.substr(11,8) != "00:00:00";
    }

    public registerFrom():void {
        console.log("From!");
        this.timesheetService.upsertAttendanceFrom(this.user.id)
            .subscribe(result => this.updateTimesheet(result));
    }

    public registerTo():void {
        console.log("To!");
        this.timesheetService.upsertAttendanceTo(this.user.id)
            .subscribe(result => this.updateTimesheet(result));
    }



    private findUser(timesheets:Timesheet[]):void {
        for (let timesheet of timesheets) {
            if (timesheet.personId === this.user.id) {
                this.timesheet = timesheet;
                console.log("Find user timesheet "+JSON.stringify(timesheet));
                return;
            }
        }
    }

    private updateTimesheet(result:any):void {
        if ((result.updated === 1 || result.created === 1) && result.timesheet) {
            this.timesheet = result.timesheet;
        } else {
            console.log("Something went wrong when from or to "+JSON.stringify(result));
            this.alertService.error("Nie udalo sie zaktualizować danych!");
        }
    }
}
