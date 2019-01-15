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

    private displayBreakDialog: boolean;
    private totalBreakInMinutes: number = 15;

    private _timesheet: Timesheet;
    get timesheet(): Timesheet {
        return this._timesheet;
    }

    private _unregisteredExits: string[];
    get unregisteredExits():string[] {
        return this._unregisteredExits;
    }


    constructor(private timesheetService:TimesheetService,
                private toolsService: ToolsService,
                private alertService: AlertService) {
    }

    ngOnInit() {
        this._unregisteredExits = [];

        let today:Date = this.toolsService.getCurrentDateDayOperation(0);

        let sToday: string = today.toISOString().substring(0, 10);

        let checkFromDate = this.toolsService.getCurrentDateDayOperation(-24) // 3 weeks + 1 weekend

        let sFrom: string = checkFromDate.toISOString().substring(0, 10);

        this.timesheetService.getByIdAndDates(this.user.id, sFrom, sToday)
            .subscribe((timesheets:Timesheet[]) => this.checkUser(timesheets, sToday));
    }

    public isSetFrom():boolean {
        return this._timesheet.from && this._timesheet.from.substr(11,8) != "00:00:00";
    }

    public isSetTo():boolean {
        return this._timesheet.to && this._timesheet.to.substr(11,8) != "00:00:00";
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

    public registerBreak(): void {
        console.log("register break!");
        this.timesheetService.upsertAttendanceBreak(this.user.id, this.totalBreakInMinutes)
            .subscribe(result => this.updateTimesheet(result));
    }

    public addBreak():void {
        this.displayBreakDialog = true;
    }

    private checkUser(timesheets:Timesheet[], sToday:string):void {
        for (let timesheet of timesheets) {
            if (timesheet.personId === this.user.id) {
                if (timesheet.from && timesheet.from.startsWith(sToday)) {
                    this._timesheet = timesheet;
                    this.totalBreakInMinutes = timesheet.break? +timesheet.break: 15;
                } else if (this.checkExitNotRegistered(timesheet)) {
                    this._unregisteredExits.push(timesheet.from.substring(0, 10));
                }
                console.log("Find user timesheet "+JSON.stringify(timesheet));
            } else {
                this.alertService.error('Zly raport czasu pracy, szukano dla '+this.user.id+', znaleziono dla '+timesheet.personId+'!')
                return
            }
        }

        if (!this._timesheet) {
            console.log('Brak czasu pracy dla '+this.user.id)
        }
    }

    private checkExitNotRegistered(timesheet: Timesheet): boolean {
        return timesheet.isLeave === 'N' && timesheet.usedTime === 0 && !timesheet.from.endsWith('00:00:00');
    }

    private updateTimesheet(result:any):void {
        if ((result.updated === 1 || result.created === 1) && result.timesheet) {
            this._timesheet = result.timesheet;
        } else {
            console.log("Something went wrong when from or to "+JSON.stringify(result));
            this.alertService.error("Nie udalo sie zaktualizować danych!");
        }
        this.displayBreakDialog = false;
    }
}
