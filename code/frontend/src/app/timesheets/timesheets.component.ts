import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Observable }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';



import { User, RelatedItem, Order, WorkType, CodeValue, Timesheet } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService, TimesheetService } from '../_services/index';
import { Calendar } from '../_models/calendar';
import { UserWithSheet } from 'app/_models/userWithSheet';
import { UserTableSummary } from 'app/_models/userTableSummary';

@Component({
    selector: 'app-timesheets',
    templateUrl: './timesheets.component.html',
    styleUrls: ['./timesheets.component.css']
})
export class TimesheetsComponent implements OnInit {

    users:User[];
    usersWithSheets:UserWithSheet[] = <UserWithSheet[]> [];

    sStatusEdited: string = 'EDITED';
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
    pl: Calendar;
    cols: any;
    summary: UserTableSummary;

    constructor(private router:Router,
                private userService:UserService,
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
        this.cols = [
            { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-10 col-icon", expand:true, edit:false},            
            { field: 'rowid', header: 'tabid', hidden:true, sortable: true, filter:true, class:"width-35",exportable: false},
            { field: 'office', header: 'Biuro' , filter:true, class:"width-35"},
            { field: 'firstName', header: 'Imie', sortable:true, filter:true, class:"width-50"},
            { field: 'lastName', header: 'Nazwisko',sortable:true, filter:true,class:"width-35" },
            { field: 'isManagerOrOperator', header: '',hidden:true, sortable:true, filter:false,class:"width-35 text-right"}, 
            { field: 'copy.fromMobileDevice', nested: 'fromMobileDevice', header: 'Wejście', sortable:true, filter:true, class:"width-35", inOut: true },
            { field: 'copy.toMobileDevice', nested: 'toMobileDevice', header: 'Wyjście', sortable:true , filter:true, class:"width-35", inOut:true },
            { field: 'timesheetWorkDate', header: 'Dnia' , sortable:true, filter:true, class:"width-50 text-center"},
            { field: 'isLeave', header: 'Urlop',sortable:true , filter:true, class:"width-35 text-center", edit: true, isLeave:true},
            { field: 'timesheetFrom', header: 'Obecny od', sortable:true , filter:true, class:"width-35 text-center", edit: true }, 
            { field: 'timesheetTo', header: 'Obecny do',  sortable:true, filter:true,class:"width-35 text-center", edit: true },
            { field: 'timesheetBreakInMinutes', header: 'Przerwa [min]' ,sortable:true, filter:true,class:"width-50 text-center", edit: true, break:true},      
            { field: 'timesheetTrainingInGMM', header: 'Szkolenie [g:mm]', sortable:true, filter:true, class:"width-50 text-center", edit: true, training:true },
            { field: 'timesheetUsedTime', header: 'Obecność', sortable:true, filter:true, class:"width-50 text-center"},           
            { field: 'status', header: 'Zapisano', sortable: true, filter:true, class:"width-35 col-icon", status:true},             
        ]
    }

    refreshTable(refresh: boolean) {
        if (refresh) {
            console.log('Refresh timsheet table...');
            this.search();
        }

    }

    onEditInit(event) {
        console.log('on edit init');
        console.log(event);
        console.log('about edit !' + JSON.stringify(event.data));

        if (event.data){
            if (event.data.timesheetFrom === this.sEmptySheet && event.data.timesheetTo === this.sEmptySheet ||
                event.data.timesheetFrom === this.sWeekendSheet && event.data.timesheetTo === this.sWeekendSheet) {
                //cleaning BRAK values
                event.data.timesheetFrom = '';
                event.data.timesheetTo = '';
                event.data.timesheetBreakInMinutes = this.toolsService.DEFAULT_BREAK;
                event.data.timesheetTrainingInGMM = '';
                event.data.color = '#2399e5';
            }        
        }
        
    }

    onEditCancel(event) {
        console.log('cancel');
        console.log(event);
        this.onEditComplete(event);
    }

    valueChange(rowData: any){
         console.log('edit');
         console.log('edit !' + JSON.stringify(rowData));

        if (rowData.roleCode.indexOf('OP') > -1 || rowData.roleCode.indexOf('MG') > -1) {
            if (this.user.roleCode.indexOf('TS') < 0) {
                this.alertService.warn("Brak uprawnień");
                this.restore(rowData);
            }
        }

        if (rowData.timesheetFrom.length === 2) {
            if (this.hourRegexp.test(rowData.timesheetFrom)) {
                rowData.timesheetFrom+=':';
            } else {
                rowData.timesheetFrom='';
            }
        } else if (rowData.timesheetFrom.length > 5) {
            this.alertService.warn('Zbyt długie pole od '+rowData.timesheetFrom);
            rowData.timesheetFrom = rowData.timesheetFrom.substr(0, 5);
        }

        if (rowData.timesheetTo.length === 2) {
            if (this.hourRegexp.test(rowData.timesheetTo)) {
                rowData.timesheetTo+=':';
            } else {
                rowData.timesheetTo='';
            }
        } else if (rowData.timesheetTo.length > 5) {
            this.alertService.warn('Zbyt długie pole do '+rowData.timesheetFrom);
            rowData.timesheetTo = rowData.timesheetTo.substr(0, 5);
        }

        if (rowData.timesheetTrainingInGMM.length === 1) {
            if (this.hourRegexp.test(rowData.timesheetTrainingInGMM)) {
                rowData.timesheetTrainingInGMM+=':';
            }
            else {
                rowData.timesheetTrainingInGMM='';
            }
        } else if (rowData.timesheetTrainingInGMM.length > 4) {
            this.alertService.warn('Zbyt długie pole szkolenie '+rowData.timesheetTrainingInGMM);
            if (rowData.timesheetTrainingInGMM.indexOf(':') === 1) {
                rowData.timesheetTrainingInGMM = rowData.timesheetTrainingInGMM.substr(0, 4);
            } else {
                rowData.timesheetTrainingInGMM = '0';
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

            if (userWithSheet.isManagerOrOperator === 'VIP' && this.user.roleCode.indexOf('TS') === -1) {
                userWithSheet.color = 'darkgrey';
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

        let fromDate: Date = this.toolsService.parseDate(from);
        let toDate: Date = this.toolsService.parseDate(to);
        let interval: number = toDate.getTime() - fromDate.getTime();

        let timesheet: Timesheet = new Timesheet(userWithSheet.id, from, to);

        console.log(`getTimesheet from: ${from}, to: ${to}, break: ${userWithSheet.timesheetBreakInMinutes}, copy: ${userWithSheet.copy.break}, all: ${JSON.stringify(userWithSheet)}`);

        if (interval > 0 && interval < this.toolsService.FOUR_HOURS &&
            (userWithSheet.timesheetBreakInMinutes == userWithSheet.copy.break || (userWithSheet.status == this.sStatusEdited && +userWithSheet.copy.break == 0 && +userWithSheet.timesheetBreakInMinutes == this.toolsService.DEFAULT_BREAK))
        ) {
            //override when work time's less then 4h, but not when somebody set arbitrary value
            //1. insert to (userWithSheet.timesheetBreakInMinutes == userWithSheet.copy.break)
            //2. insert from and to (userWithSheet.status == this.sStatusEdited && +userWithSheet.copy.break == 0 && +userWithSheet.timesheetBreakInMinutes == this.toolsService.DEFAULT_BREAK)
            timesheet.break = "0";
        } else {
            timesheet.break = userWithSheet.timesheetBreakInMinutes;
        }

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

                console.log(`Check if timesheet needs update-> newTimesheet: ${JSON.stringify(newTimesheet)}, copy: ${JSON.stringify(event.data.copy)} `);
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
            event.data.status = this.sStatusEdited;
        } else {
            console.log('Nie wypelniono poprawnie timesheetu '+JSON.stringify(event.data));
            this.restore(event.data);
        }
        
    }



    search() {
        let sAfterDate: string = this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd');
        let sBeforeDate: string = this.toolsService.formatDate(this.beforeDate, 'yyyy-MM-dd');
        console.log('Searching for '+this.afterDate+'='+sAfterDate+', '+this.beforeDate+'='+sBeforeDate);

        this.userService.getStaff().pipe(
            mergeMap(staff => this.callTimesheets(this.filterNotActive(staff), sAfterDate, sBeforeDate)))
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
        this.summary = this.toolsService.createSummaryForUserTable(this.usersWithSheets);
    }

    private createUserWithSheet(timesheet: Timesheet, users: User[], rowid: number): UserWithSheet {
        let user = this.getUser(timesheet.personId, users);

        if (user != null) {
            let userWithSheet:UserWithSheet = <UserWithSheet> JSON.parse(JSON.stringify(user));
            userWithSheet.copy = JSON.parse(JSON.stringify(timesheet));

            userWithSheet.rowid = rowid;
            userWithSheet.isManagerOrOperator = (user.roleCode.indexOf('MG') > -1 || user.roleCode.indexOf('OP') > -1) ? 'VIP': 'Master';

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

        // this.usersWithSheets[rowid] = userWithSheet;
        // this.usersWithSheets = JSON.parse(JSON.stringify(this.usersWithSheets)); //immutable dirty trick
        this.search();
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


