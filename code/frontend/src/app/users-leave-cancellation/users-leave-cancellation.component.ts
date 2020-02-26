import { Component, OnInit } from '@angular/core';
import { TimesheetService, ToolsService, UserService, AlertService } from 'app/_services';
import { Timesheet, User, Calendar } from 'app/_models';
import { mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserWithSheet } from 'app/_models/userWithSheet';
import { error } from 'util';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-users-leave-cancellation',
  templateUrl: './users-leave-cancellation.component.html',
  styleUrls: ['./users-leave-cancellation.component.css']
})
export class UsersLeaveCancellationComponent implements OnInit {
  datepipe :DatePipe = new DatePipe('en-US');

  isLeaveColllection: Timesheet[] = [];
  users: User[] = [];
  usersWithSheets: UserWithSheet[] = [];
  selectedLeaveToCancel: UserWithSheet[] = [];

  displayIsLeaveTable = false;
  cols: any;
  pl: Calendar;
  afterDate: Date;
  beforeDate: Date;
  minDateValue: Date;

  sAfterDate: string;
  sBeforeDate: string;

  constructor(private timesheetService:TimesheetService,
              private toolsService:ToolsService,
              private userService:UserService,
              private alertService:AlertService) {
                this.afterDate = this.toolsService.getCurrentDateDayOperation(0);
                this.beforeDate = this.toolsService.getCurrentDateDayOperation(10);
                this.minDateValue = this.toolsService.getCurrentDateDayOperation(0);
               }

  ngOnInit() {
    this.pl=new Calendar();
    this.getIsLeaveCollection();
    this.cols = [          
      { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-10 col-icon", check: true},
      { field: 'rowid', header: 'tabid', hidden:true, sortable: true, filter:true, class:"width-35",exportable: false},
      { field: 'office', header: 'Biuro' , filter:true, class:"width-35"},
      { field: 'firstName', header: 'Imie', sortable:true, filter:true, class:"width-35"},
      { field: 'lastName', header: 'Nazwisko',sortable:true, filter:true,class:"width-35" },
      { field: 'copy.from',nested: 'from', header: 'Od kiedy',sortable:true, filter:true,class:"width-35", fromCopy: true  },
      { field: 'copy.to',nested: 'to', header: 'Do kiedy',sortable:true, filter:true,class:"width-35", fromCopy: true },
      { field: 'copy.createdBy',nested: 'createdBy', header: 'Dodany przez',sortable:true, filter:true,class:"width-35",fromCopy: true },     
      { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-35 col-icon", cancelLeave: true},                
    ]
  }

  public search(): void {
    this.getIsLeaveCollection().subscribe((collection:Timesheet[]) => this.isLeaveColllection = collection);
  }

  public cancelSelected (): void {
    if (this.selectedLeaveToCancel.length > 0) {
      for (let holliday of this.selectedLeaveToCancel) {       
         this.removeIsLeave(holliday)
      }
    }
  }

  public showIsLeaveTable(): void {
    this.getUsers();
    this.displayIsLeaveTable = true;
  }
  
  public callRemoveIsLeave (event)  : void {
    this.removeIsLeave(event);
  }

  private removeIsLeave (holliday: UserWithSheet): void {
    let newTimesheet: Timesheet = this.getLeaveCancelledTimesheet(holliday);
    this.timesheetService.upsert(newTimesheet).subscribe(succes => {
      this.getUsers();
      this.alertService.success('Usunięto urlop dla '+holliday.firstName+' '+holliday.lastName+' w dniu '+holliday.copy.from);
      this.selectedLeaveToCancel.splice(this.selectedLeaveToCancel.findIndex(item=> item.id == holliday.id),1);
    }, error => {
      this.alertService.error('Nie udało się anulować urlopu dla '+holliday.firstName+' '+holliday.lastName+' w dniu '+holliday.copy.from);
    } );
  }

  private getIsLeaveCollection () : Observable<Timesheet[]>  {
    this.sAfterDate = this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd');
    this.sBeforeDate = this.toolsService.formatDate(this.beforeDate, 'yyyy-MM-dd');
    return this.timesheetService.getIsLeavByDates(this.sAfterDate,this.sBeforeDate);
  }

  private getUsers () : void{
    this.userService.getActiveStaff().pipe(
      mergeMap(staff => this.callTimesheets(staff, this.sAfterDate, this.sBeforeDate)))
      .subscribe((timesheets:Timesheet[]) => this.combine(timesheets, this.users));
  }

  private callTimesheets(staff: User[], after:string, before:string):Observable<Timesheet[]> {
    console.log('Got '+staff.length+' staff!');
    this.users = staff;
    return this.timesheetService.getIsLeavByDates(after, before);
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
        userWithSheet.isManagerOrOperator = (user.roleCode.indexOf('MG') > -1 || user.roleCode.indexOf('OP') > -1) ? 'VIP': 'Master';
        return userWithSheet;
    }
    return null;
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

  private getLeaveCancelledTimesheet(userWithSheet: UserWithSheet): Timesheet {
    let dFrom = new Date(userWithSheet.copy.from);
    let dTo = new Date(userWithSheet.copy.to);
    let from = this.datepipe.transform(dFrom, 'yyyy-MM-dd')+' 08:00:00';
    let to = this.datepipe.transform(dTo, 'yyyy-MM-dd')+' 16:00:00';
    let timesheet: Timesheet = new Timesheet(userWithSheet.id, from, to);
    timesheet.break = '0';
    timesheet.training = '0';
    timesheet.isLeave = 'N';
    return timesheet;
  }
}
