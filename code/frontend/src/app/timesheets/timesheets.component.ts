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

    users:User[];
    usersWithSheets:UserWithSheet[] = <UserWithSheet[]> [];

    sEmptySheet: string = "BRAK";
    warns: string[];
    timeRegexp: RegExp =  new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');
    hourRegexp: RegExp =  new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3])$');

    afterDate:Date;
    beforeDate:Date;


    user: User;


    constructor(private userService:UserService,
                private timesheetService:TimesheetService,
                private dictService:DictService,
                private alertService:AlertService,
                private toolsService:ToolsService,
                private authSerice:AuthenticationService) {

        this.afterDate = toolsService.getCurrentDateDayOperation(0);
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
        this.dictService.init();
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.user = user);
        this.search();
    }


    onEditInit(event) {
        console.log("about edit !" + JSON.stringify(event.data));

        if (event.data.timesheetFrom === this.sEmptySheet && event.data.timesheetTo === this.sEmptySheet) {
            //cleaning BRAK values
            event.data.timesheetFrom = "";
            event.data.timesheetTo = "";
            event.data.timesheetBreakInMinutes = 15;
            event.data.color = "#2399e5";
        }
    }

    onEditCancel(event) {
        this.onEditComplete(event);
    }

    onEdit(event) {
        console.log("edit !" + JSON.stringify(event.data));

        if (event.data.timesheetFrom.length === 2) {
            if (this.hourRegexp.test(event.data.timesheetFrom)) {
                event.data.timesheetFrom+=":";
            } else {
                event.data.timesheetFrom="";
            }
        } else if (event.data.timesheetFrom.length > 5) {
            console.log("Too long from");
            event.data.timesheetFrom = event.data.timesheetFrom.substr(0, 5);
        }

        if (event.data.timesheetTo.length === 2) {
            if (this.hourRegexp.test(event.data.timesheetTo)) {
                event.data.timesheetTo+=":";
            } else {
                event.data.timesheetTo="";
            }
        } else if (event.data.timesheetTo.length > 5) {
            console.log("Too long to");
            event.data.timesheetTo = event.data.timesheetTo.substr(0, 5);
        }


    }

    private restore(userWithSheet: UserWithSheet) {
        if (userWithSheet.copy.usedTime == 0) {
            userWithSheet.timesheetBreakInMinutes = this.sEmptySheet;
            userWithSheet.timesheetWorkDate = userWithSheet.copy.from.substr(0, 10);
            userWithSheet.timesheetFrom = this.sEmptySheet;
            userWithSheet.timesheetTo = this.sEmptySheet;
            userWithSheet.timesheetUsedTime = userWithSheet.copy.usedTime;
            userWithSheet.color = "darkred";
        } else {
            userWithSheet.timesheetBreakInMinutes = userWithSheet.copy.break;
            userWithSheet.timesheetWorkDate = userWithSheet.copy.from.substr(0, 10);
            userWithSheet.timesheetFrom = userWithSheet.copy.from.substr(11, 5);
            userWithSheet.timesheetTo = userWithSheet.copy.to.substr(11, 5);
            userWithSheet.timesheetUsedTime = userWithSheet.copy.usedTime;
            userWithSheet.color = "darkgreen";
        }
        userWithSheet.status = "OK";
    }

    private getTimesheet(userWithSheet: UserWithSheet): Timesheet {
        let from: string = userWithSheet.timesheetWorkDate+" "+userWithSheet.timesheetFrom+":00";
        let to: string = userWithSheet.timesheetWorkDate+" "+userWithSheet.timesheetTo+":00";
        let timesheet: Timesheet = new Timesheet(userWithSheet.id, from, to);
        timesheet.break = userWithSheet.timesheetBreakInMinutes;
        return timesheet;
    }

    onEditComplete(event) {
        console.log("edited !" + JSON.stringify(event.data));
        if (event.data.timesheetFrom && event.data.timesheetFrom!== this.sEmptySheet && !this.timeRegexp.test(event.data.timesheetFrom)) {
            this.alertService.warn("Nie zmieniono deklaracji ze względu na nieprawidlową wartość: "+event.data.timesheetFrom);
            this.restore(event.data);
        }

        if (event.data.timesheetTo && event.data.timesheetTo!== this.sEmptySheet && !this.timeRegexp.test(event.data.timesheetTo)) {
            this.alertService.warn("Nie zmieniono deklaracji ze względu na nieprawidlową wartość: "+event.data.timesheetTo);
            this.restore(event.data);
        }

        if (event.data.timesheetFrom && this.timeRegexp.test(event.data.timesheetFrom) && event.data.timesheetTo && this.timeRegexp.test(event.data.timesheetTo)) {
            if (event.data.timesheetFrom <= event.data.timesheetTo) {
                let newTimesheet: Timesheet = this.getTimesheet(event.data);
                if (newTimesheet.break != event.data.copy.break || newTimesheet.from != event.data.copy.from || newTimesheet.to != event.data.copy.to) {
                    event.data.status = "PROGRESS";
                    this.timesheetService.upsert(newTimesheet).subscribe(timesheet => this.updateTable(timesheet, event.data.rowid));
                    //this.alertService.info("TODO call backend " + JSON.stringify(newTimesheet));
                } else {
                    console.log("Content is identical, nothing todo");
                }

            } else {
                this.alertService.warn("Nie zmieniono deklaracji ze względu na czas pracy mniejszy niż zero!");
                this.restore(event.data);
            }
        } else if ((event.data.timesheetFrom && this.timeRegexp.test(event.data.timesheetFrom)) || (event.data.timesheetTo && this.timeRegexp.test(event.data.timesheetTo))) {
            event.data.status = "EDITED";
        } else {
            console.log("Nie wypelniono poprawnie timesheetu "+JSON.stringify(event.data));
            this.restore(event.data);
        }
    }



    search() {
        let sAfterDate: string = this.afterDate.toISOString().substring(0, 10);
        let sBeforeDate: string = this.beforeDate.toISOString().substring(0, 10);
        console.log("Searching for "+this.afterDate+"="+sAfterDate+", "+this.beforeDate+"="+sBeforeDate);

        this.userService.getStaff()
            .mergeMap(staff => this.callTimesheets(staff, sAfterDate, sBeforeDate))
            .subscribe((timesheets:Timesheet[]) => this.combine(timesheets, this.users));
    }

    private callTimesheets(staff: User[], after:string, before:string):Observable<Timesheet[]> {
        console.log("Got "+staff.length+" staff!");
        this.users = staff;
        return this.timesheetService.getByDates(after, before);
    }


    private combine(timesheets:Timesheet[], users:User[]):void {
        console.log("combine "+JSON.stringify(timesheets) +"\n"+JSON.stringify(users));

        this.usersWithSheets = [];
        for (let timesheet of timesheets) {

            let userWithSheet = this.createUserWithSheet(timesheet, users, this.usersWithSheets.length);

            if (userWithSheet != null) {
                console.log("pushing " + JSON.stringify(userWithSheet));
                this.usersWithSheets.push(userWithSheet);
            } else {
                console.log("User not found "+timesheet.personId);
            }
        }


    }

    private createUserWithSheet(timesheet: Timesheet, users: User[], rowid: number): UserWithSheet {
        let user = this.getUser(timesheet.personId, users);

        if (user != null) {
            let userWithSheet:UserWithSheet = <UserWithSheet> JSON.parse(JSON.stringify(user));
            userWithSheet.copy = JSON.parse(JSON.stringify(timesheet));

            userWithSheet.rowid = rowid;

            this.restore(userWithSheet);

            return userWithSheet;
        }

        return null;
    }

    private updateTable(timesheet:Timesheet, rowid:number):void {
        console.log("Updating table after data from server:" +JSON.stringify(timesheet));

        let userWithSheet = this.createUserWithSheet(timesheet, this.users, rowid);

        if (userWithSheet == null) {
            this.alertService.error("Nie znaleziono pracownika "+timesheet.personId+" po aktualizacji timesheet!");
            return;
        }

        this.usersWithSheets[rowid] = userWithSheet;
        this.usersWithSheets = JSON.parse(JSON.stringify(this.usersWithSheets)); //immutable dirty trick
    }

    private getUser(id: number, users: User[]): User {
        for(let user of users) {
            if (user.id === id) {
                return user;
            }
        }

        console.log("Nie znaleziono pracownika o id "+id+" na liscie rol");
        return null;
    }


    private warn(msg: string): void {
        this.alertService.warn(msg);
        this.warns.push(msg);
    }

}


export class UserWithSheet extends User {
    rowid: number;

    copy: Timesheet;

    timesheetUsedTime: number; //flat property for p-dataTable used for sort
    timesheetWorkDate: string;
    timesheetFrom: string;
    timesheetTo: string;
    timesheetBreakInMinutes: string;

    color: string;
    status: string;

}

