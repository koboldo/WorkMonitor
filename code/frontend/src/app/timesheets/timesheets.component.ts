import { Component, OnInit } from '@angular/core';

import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { User, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';
import { Calendar } from '../_models/calendar';

@Component({
    selector: 'app-timesheets',
    templateUrl: './timesheets.component.html',
    styleUrls: ['./timesheets.component.css']
})
export class TimesheetsComponent implements OnInit {

    users:User[];
    usersWithSheets:UserWithSheet[] = <UserWithSheet[]> [];

    sEmptySheet: string = 'BRAK';
    sWeekendSheet: string = 'Weekend';
    sLeave: string = 'Urlop';
    warns: string[];
    timeRegexp: RegExp =  new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');
    hourRegexp: RegExp =  new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3])$');
    leaveRegexp: RegExp =  new RegExp('^([NY])$');

    afterDate:Date;
    beforeDate:Date;


    user: User;
    pl:Calendar;

    constructor(private userService:UserService,
                private timesheetService:TimesheetService,
                private dictService:DictService,
                private workTypeService: WorkTypeService,
                private alertService:AlertService,
                private toolsService:ToolsService,
                private authSerice:AuthenticationService) {

        this.afterDate = toolsService.getCurrentDateDayOperation(0);
        this.beforeDate = toolsService.getCurrentDateDayOperation(0);
        this.dictService.init();
        this.workTypeService.init();
    }

    ngOnInit() {
        this.authSerice.userAsObs.subscribe(user => this.user = user);
        this.search();
        this.pl=new Calendar();
    }


    onEditInit(event) {
        console.log('about edit !' + JSON.stringify(event.data));

        if (event.data.timesheetFrom === this.sEmptySheet && event.data.timesheetTo === this.sEmptySheet ||
            event.data.timesheetFrom === this.sWeekendSheet && event.data.timesheetTo === this.sWeekendSheet) {
            //cleaning BRAK values
            event.data.timesheetFrom = '';
            event.data.timesheetTo = '';
            event.data.timesheetBreakInMinutes = 15;
            event.data.timesheetTrainingInGMM = '';
            event.data.color = '#2399e5';
        }
    }

    onEditCancel(event) {
        this.onEditComplete(event);
    }

    onEdit(event) {
        console.log('edit !' + JSON.stringify(event.data));

        if (event.data.timesheetFrom.length === 2) {
            if (this.hourRegexp.test(event.data.timesheetFrom)) {
                event.data.timesheetFrom+=':';
            } else {
                event.data.timesheetFrom='';
            }
        } else if (event.data.timesheetFrom.length > 5) {
            this.alertService.warn('Zbyt długie pole od '+event.data.timesheetFrom);
            event.data.timesheetFrom = event.data.timesheetFrom.substr(0, 5);
        }

        if (event.data.timesheetTo.length === 2) {
            if (this.hourRegexp.test(event.data.timesheetTo)) {
                event.data.timesheetTo+=':';
            } else {
                event.data.timesheetTo='';
            }
        } else if (event.data.timesheetTo.length > 5) {
            this.alertService.warn('Zbyt długie pole do '+event.data.timesheetFrom);
            event.data.timesheetTo = event.data.timesheetTo.substr(0, 5);
        }

        if (event.data.timesheetTrainingInGMM.length === 1) {
            if (this.hourRegexp.test(event.data.timesheetTrainingInGMM)) {
                event.data.timesheetTrainingInGMM+=':';
            }
            else {
                event.data.timesheetTrainingInGMM='';
            }
        } else if (event.data.timesheetTrainingInGMM.length > 4) {
            this.alertService.warn('Zbyt długie pole szkolenie '+event.data.timesheetTrainingInGMM);
            if (event.data.timesheetTrainingInGMM.indexOf(':') === 1) {
                event.data.timesheetTrainingInGMM = event.data.timesheetTrainingInGMM.substr(0, 4);
            } else {
                event.data.timesheetTrainingInGMM = '0';
            }

        }

    }

    private restore(userWithSheet: UserWithSheet) {
        if (userWithSheet.copy.usedTime == 0 && '00:00' == userWithSheet.copy.from.substr(11, 5) && '00:00' == userWithSheet.copy.to.substr(11, 5)) {
            userWithSheet.timesheetBreakInMinutes = this.sEmptySheet;
            userWithSheet.timesheetTrainingInGMM = this.sEmptySheet;
            userWithSheet.timesheetWorkDate = userWithSheet.copy.from.substr(0, 10);
            userWithSheet.timesheetFrom = this.sEmptySheet;
            userWithSheet.timesheetTo = this.sEmptySheet;
            userWithSheet.timesheetUsedTime = userWithSheet.copy.usedTime;
            userWithSheet.color = '#902828';

            if (this.isWeekend(userWithSheet.copy.from)) {
                userWithSheet.timesheetBreakInMinutes = this.sWeekendSheet;
                userWithSheet.timesheetTrainingInGMM = this.sWeekendSheet;
                userWithSheet.timesheetFrom = this.sWeekendSheet;
                userWithSheet.timesheetTo = this.sWeekendSheet;
                userWithSheet.color = 'grey';
            }


        } else {
            userWithSheet.timesheetBreakInMinutes = userWithSheet.copy.break;
            userWithSheet.timesheetTrainingInGMM = this.toolsService.convertMinutesToGMM(userWithSheet.copy.training);
            userWithSheet.timesheetWorkDate = userWithSheet.copy.from.substr(0, 10);
            userWithSheet.timesheetFrom = userWithSheet.copy.from.substr(11, 5);
            userWithSheet.timesheetTo = userWithSheet.copy.to.substr(11, 5);
            userWithSheet.timesheetUsedTime = userWithSheet.copy.usedTime;

            if (userWithSheet.copy.createdBy && userWithSheet.copy.modifiedBy &&
                userWithSheet.copy.createdBy === userWithSheet.copy.modifiedBy &&
                userWithSheet.copy.createdBy === userWithSheet.firstName+' '+userWithSheet.lastName) {

                userWithSheet.color = '#28902f';
            } else {
                userWithSheet.color = '#286090';
            }
        }

        userWithSheet.isLeave = userWithSheet.copy.isLeave;
        if (userWithSheet.isLeave === 'Y') {
            userWithSheet.timesheetBreakInMinutes = this.sLeave;
            userWithSheet.timesheetTrainingInGMM = this.sLeave;
            userWithSheet.timesheetFrom = this.sLeave;
            userWithSheet.timesheetTo = this.sLeave;
            userWithSheet.color = '#444433';
        }



        userWithSheet.status = 'OK';
    }


    private getTimesheet(userWithSheet: UserWithSheet, trainingInMinutes: number): Timesheet {
        let from: string = userWithSheet.timesheetWorkDate+' '+userWithSheet.timesheetFrom+':00';
        let to: string = userWithSheet.timesheetWorkDate+' '+userWithSheet.timesheetTo+':00';
        let timesheet: Timesheet = new Timesheet(userWithSheet.id, from, to);
        timesheet.break = userWithSheet.timesheetBreakInMinutes;
        timesheet.training = ''+trainingInMinutes;
        return timesheet;
    }


    private getLeaveCancelledTimesheet(userWithSheet: UserWithSheet): Timesheet {
        let timesheet: Timesheet = new Timesheet(userWithSheet.id, userWithSheet.timesheetWorkDate+' 08:00', userWithSheet.timesheetWorkDate+' 08:00');
        timesheet.break = '0';
        timesheet.training = '0';
        timesheet.isLeave = 'N';
        return timesheet;
    }

    onEditComplete(event) {

        let trainingInMinutes: number = event.data.timesheetTrainingInGMM.indexOf(':') == 1 ? parseInt(this.toolsService.convertGMMToMinutes(event.data.timesheetTrainingInGMM), 10) : 0;

        console.log('edited !' + JSON.stringify(event.data));
        if (this.leaveRegexp.test(event.data.isLeave) && event.data.isLeave==='N' && event.data.copy.isLeave!=='N') {
            this.alertService.info('Usuwam urlop '+event.data.timesheetWorkDate+' dla '+event.data.firstName+' '+event.data.lastName+' ...');
            event.data.status = 'PROGRESS';
            let newTimesheet: Timesheet = this.getLeaveCancelledTimesheet(event.data);
            this.timesheetService.upsert(newTimesheet).subscribe(timesheet => this.updateTable(timesheet, event.data.rowid));
        }

        else if (event.data.timesheetFrom && event.data.timesheetFrom!== this.sEmptySheet && event.data.timesheetFrom!== this.sWeekendSheet && !this.timeRegexp.test(event.data.timesheetFrom) && !this.leaveRegexp.test(event.data.isLeave)) {
            this.alertService.warn('Nie zmieniono deklaracji ze względu na nieprawidlową wartość: '+event.data.timesheetFrom);
            this.restore(event.data);
        }

        else if (event.data.timesheetTo && event.data.timesheetTo!== this.sEmptySheet && event.data.timesheetTo!== this.sWeekendSheet && !this.timeRegexp.test(event.data.timesheetTo)) {
            this.alertService.warn('Nie zmieniono deklaracji ze względu na nieprawidlową wartość: '+event.data.timesheetTo);
            this.restore(event.data);
        }

        else if (trainingInMinutes > 0 && (!event.data.timesheetUsedTime || event.data.timesheetUsedTime === 0) ) {
            this.alertService.warn('Nie zmieniono deklaracji - wprowadzono szkolenie ['+trainingInMinutes+'][min], brak czasu pracy!');
            this.restore(event.data);
        }

        else if (event.data.timesheetUsedTime && parseInt(this.toolsService.convertHoursDecimalToMinutes(event.data.timesheetUsedTime, 0.01), 10) < trainingInMinutes) {
            this.alertService.warn('Nie zmieniono deklaracji - szkolenie ['+trainingInMinutes+'][min] dłuższe niż czas pracy ['+this.toolsService.convertHoursDecimalToMinutes(event.data.timesheetUsedTime, 0.01)+'][min] !');
            this.restore(event.data);
        }

        else if (event.data.timesheetFrom && this.timeRegexp.test(event.data.timesheetFrom) && event.data.timesheetTo && this.timeRegexp.test(event.data.timesheetTo)  && this.leaveRegexp.test(event.data.isLeave)) {
            if (event.data.timesheetFrom <= event.data.timesheetTo) {
                let newTimesheet: Timesheet = this.getTimesheet(event.data, trainingInMinutes);
                if (newTimesheet.break != event.data.copy.break || newTimesheet.from != event.data.copy.from || newTimesheet.to != event.data.copy.to || newTimesheet.training != event.data.copy.training) {
                    event.data.status = 'PROGRESS';
                    if (newTimesheet.break === '') {
                        newTimesheet.break = '0';
                    }
                    if (newTimesheet.training === '') {
                        newTimesheet.training = '0';
                    }
                    this.timesheetService.upsert(newTimesheet).subscribe(timesheet => this.updateTable(timesheet, event.data.rowid));
                } else if (this.leaveRegexp.test(event.data.isLeave) && event.data.isLeave==='Y' && event.data.copy.isLeave!=='Y') {
                    this.alertService.warn('Nie można dodawać urlopu w tabeli!');
                    this.restore(event.data);
                } else {
                    console.log('Content is identical, nothing todo');
                }

            } else {
                this.alertService.warn('Nie zmieniono deklaracji ze względu na czas pracy mniejszy niż zero!');
                this.restore(event.data);
            }
        } else if ((event.data.timesheetFrom && this.timeRegexp.test(event.data.timesheetFrom)) || (event.data.timesheetTo && this.timeRegexp.test(event.data.timesheetTo))) {
            event.data.status = 'EDITED';
        } else {
            console.log('Nie wypelniono poprawnie timesheetu '+JSON.stringify(event.data));
            this.restore(event.data);
        }
    }



    search() {
        let sAfterDate: string = this.afterDate.toISOString().substring(0, 10);
        let sBeforeDate: string = this.beforeDate.toISOString().substring(0, 10);
        console.log('Searching for '+this.afterDate+'='+sAfterDate+', '+this.beforeDate+'='+sBeforeDate);

        this.userService.getStaff()
            .mergeMap(staff => this.callTimesheets(this.filterNotActive(staff), sAfterDate, sBeforeDate))
            .subscribe((timesheets:Timesheet[]) => this.combine(timesheets, this.users));
    }

    private callTimesheets(staff: User[], after:string, before:string):Observable<Timesheet[]> {
        console.log('Got '+staff.length+' staff!');
        this.users = staff;
        return this.timesheetService.getByDates(after, before);
    }


    private combine(timesheets:Timesheet[], users:User[]):void {
        console.log('combine '+JSON.stringify(timesheets) +'\n'+JSON.stringify(users));

        this.usersWithSheets = [];
        for (let timesheet of timesheets) {

            let userWithSheet = this.createUserWithSheet(timesheet, users, this.usersWithSheets.length);

            if (userWithSheet != null) {
                console.log('pushing ' + JSON.stringify(userWithSheet));
                this.usersWithSheets.push(userWithSheet);
            } else {
                console.log('User not found '+timesheet.personId);
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
        console.log('Updating table after data from server:' +JSON.stringify(timesheet));

        let userWithSheet = this.createUserWithSheet(timesheet, this.users, rowid);

        if (userWithSheet == null) {
            this.alertService.error('Nie znaleziono pracownika '+timesheet.personId+' po aktualizacji timesheet!');
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

        console.log('Nie znaleziono pracownika o id '+id+' na liscie rol');
        return null;
    }


    private warn(msg: string): void {
        this.alertService.warn(msg);
        this.warns.push(msg);
    }

    //YYYY-MM-DD
    private isWeekend(workDate:string):boolean {
        let myDate:Date = this.toolsService.parseDate(workDate);
        console.log('Data dla '+workDate+' to '+ myDate.toISOString());
        return myDate.getDay() == 6 || myDate.getDay() == 0;
    }

    private filterNotActive(staff:User[]): User[]{
        let workingStaff: User[] = [];

        for(let user of staff) {
            if (user && user.isActive === 'Y') {
                workingStaff.push(user);
            }
        }

        return workingStaff;

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
    timesheetTrainingInGMM: string;
    isLeave: string;

    color: string;
    status: string;

}

