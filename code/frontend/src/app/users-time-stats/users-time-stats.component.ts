import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersDisplayComponent } from '../users-display/users-display.component';
import { AlertService, UserService, DictService, AuthenticationService, ToolsService, UserTimeStatsService } from '../_services/index';
import { User, CodeValue, SearchUser, Timestats } from '../_models/index';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { UserTableSummary } from 'app/_models/userTableSummary';
import { ExportService } from 'app/_services/export.service';


@Component({
  selector: 'app-users-time-stats',
  templateUrl: './users-time-stats.component.html',
  styleUrls: ['./users-time-stats.component.css']
})
export class UsersTimeStatsComponent extends UsersDisplayComponent{

  selectedUsers: User[];
  displayDateChooserDialog: boolean;
  displayReportResultDialog: boolean;

  possibleDates: SelectItem[] = [];
  selectedDate: string;
  possibleWeeks: SelectItem[] = [];
  selectedWeeks: string[] = [];
  isManualWeekMode: boolean = false;

  timestats: Timestats[];
  colsTime: any;
  colsForTimeSummary: any;
  summary:  UserTableSummary;

  constructor(protected router:Router,
              protected userService:UserService,
              protected alertService:AlertService,
              protected dictService:DictService,
              protected authService:AuthenticationService,
              private toolsService: ToolsService,
              private userTimeStatsService: UserTimeStatsService,
              private exportService: ExportService) {

    super(router, userService, alertService, dictService, authService);

    this.initMonths();
    this.initWeeks();
    this.colsTime = [
      { field: 'none', excludeGlobalFilter: true,  sortable: false, filter:false,class:"width-10 col-icon", check:true,exportable:false },            
      { field: 'excelId', header: 'Id excel', sortable: true, filter:true, class:"width-35"},
      { field: 'officeCode', header: 'Biuro' , filter:true, sortable:true, class:"width-35 text-center"},
      { field: 'lastName', header: 'Osoba', sortable:true, filter:true, class:"width-50 text-center", person:true, icon:true},
      { field: 'isActive', header: 'Aktywny',sortable:true, filter:true,class:"width-35 text-center" , isActive:true, icon:true},
      { field: 'isEmployed', header: 'Pracuje', sortable:true, filter:true, class:"width-35 text-center", isEmployed: true, icon:true },
      { field: 'role', header: 'Rola', sortable:true , filter:true, class:"width-35 text-center", role:true},
      { field: 'rank', header: 'Stopień' , sortable:true, filter:true, class:"width-50 text-center", rank:true},
      { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-35 text-center", isFromPool:true, icon:true},
      { field: 'phone', header: 'Telefon', sortable:true , filter:true, class:"width-35 text-center"},  
    ]
    this.colsForTimeSummary = [
      { field: 'user.excelId', header: 'Id excel', sortable: true, filter:true, class:"width-35", excelId:true, details:true, user:true},
      { field: 'user.firstName', header: 'Imię' , filter:true, class:"width-35", firstName:true, details:true, user:true},
      { field: 'user.lastName', header: 'Nazwisko', sortable:true, filter:true, class:"width-50 text-center", lastName:true, details:true, user:true},
      { field: 'user.officeCode', header: 'Biuro',sortable:true, filter:true,class:"width-35 text-center", officeCode:true, details:true, user:true },
      { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-35 text-center", isFromPool:true, details:true},
      { field: 'periodBeginning', header: 'Od', sortable:true, filter:true, class:"width-35 text-center" },
      { field: 'periodEnd', header: 'Do', sortable:true , filter:true, class:"width-35 text-center"},
      { field: 'workTime', header: 'Czas razem' , sortable:true, filter:true, class:"width-50 text-center"},
      { field: 'poolWorkTime', header: 'Czas w puli', sortable:true , filter:true, class:"width-35 text-center color-green"},  
      { field: 'nonpoolWorkTime', header: 'Czas poza pulą', sortable:true , filter:true, class:"width-35 text-center color-green"},
      { field: 'trainingTime', header: 'Szkolenia', sortable:true , filter:true, class:"width-35 text-center"},
      { field: 'leaveTime', header: 'Urlop', sortable:true , filter:true, class:"width-35 text-center"},
      { field: 'overTime', header: 'Nadgodziny', sortable:true , filter:true, class:"width-35 text-center"},
      //hidden 
      { field: 'personId', header: 'id',hidden:true, sortable:true , filter:true, class:"width-35 text-center",exportable:false },          
    ]

  }

  public customExportCsv (table:Table) {
    let columnsToPipeFormat = ['workTime','poolWorkTime','nonpoolWorkTime','trainingTime','leaveTime','overTime'];
    this.exportService.exportCsvWithPipe(table,columnsToPipeFormat);
} 

  private initMonths() {
    let now = new Date();
    for (let i = 0; i < 12; i++) {
      let d = new Date(now.getFullYear(), now.getMonth(), 1, now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      d.setMonth(d.getMonth() - i);
      let l:string = this.toolsService.formatDate(d, 'yyyy-MM');
      let v:string = this.toolsService.formatDate(d, 'yyyy-MM-dd');
      this.possibleDates.push({label: l, value: v});
      
    }
  }

  private initWeeks() {
    let d = new Date();
    // Go back to the closest Monday
    while (d.getDay() !== 1) {
      d.setDate(d.getDate() - 1);
    }

    for (let i = 0; i < 53; i++) { // Last 53 weeks (~1 year)
      let label = 'Tydzień ' + this.getWeekNumber(d) + ' (' + this.toolsService.formatDate(d, 'yyyy-MM-dd') + ')';
      let value = this.toolsService.formatDate(d, 'yyyy-MM-dd');
      this.possibleWeeks.push({ label: label, value: value });

      d.setDate(d.getDate() - 7);
    }
  }

  // Helper to get ISO week number
  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  public showDateChooser() {
    this.displayReportResultDialog = false;
    this.displayDateChooserDialog = true;

  }

  public getTimestatReport() {
    this.displayDateChooserDialog = false;
    let ids: number[] = [];
    for (let selectedUser of this.selectedUsers) {
      ids.push(selectedUser.id);
    }
    this.userTimeStatsService.getByDateAndUserIds(this.users, this.selectedDate, ids).subscribe(timestats => {
      this.processTimestats(timestats);
     
    });
  }

  public getWeeklyTimestatReport() {
    this.displayDateChooserDialog = false;
    let ids: number[] = [];
    for (let selectedUser of this.selectedUsers) {
      ids.push(selectedUser.id);
    }
    this.userTimeStatsService.getWeeklyByDateAndUserIds(this.users, this.selectedDate, ids).subscribe(timestats => {
      this.processTimestats(timestats);

    });
  }

  public getManualWeeklyTimestatReport() {
    this.displayDateChooserDialog = false;
    let ids: number[] = [];
    for (let selectedUser of this.selectedUsers) {
      ids.push(selectedUser.id);
    }
    this.userTimeStatsService.getWeeklyByWeekListAndUserIds(this.users, this.selectedWeeks, ids).subscribe(timestats => {
      this.processTimestats(timestats);
    });
  }

  private processTimestats(timestats:Timestats[]):void {
    this.timestats = timestats;
    this.displayReportResultDialog = true;
   
  }

  // Override parent method to preselect all users
  protected processUsers(engineers:User[]):void {
    super.processUsers(engineers);
    // Preselect all filtered users
    this.selectedUsers = [...this.users];
  }

  // Override filter to maintain selection after filtering
  filter(input): void {
    super.filter(input);
    // Reselect all users after filtering
    this.selectedUsers = [...this.users];
  }  

  //   private creatSummary (users: User[]) : userTableSummary {
  //     let summary: userTableSummary;
  //     summary.totalActiveUsers = this.countActiveUsers(users);
  //     summary.totalEmployees = this.countEmployedUsers(users);
  //     summary.totalUsersFromPool = this.countUsersInPool(users);
  //     users.forEach(element => {
  //       if (element.rankCode === 'YOU'){
  //           summary.totalYOURank ++;
  //       }
  //       if (element.rankCode === 'SEN'){
  //           summary.totalSENRank ++;
  //       }
  //       if (element.rankCode === 'REG'){
  //           summary.totalREGRank ++;
  //       }
  //       if (element.rankCode === 'NONE'){
  //           summary.totalNONERank ++;
  //       }
  //       if (element.rank === 'DZI'){
  //           summary.totalDZIRank ++;
  //       }
  //     });
  //     return summary;
  //   }

  //   private countUsersInPool (users: User[]): number {
  //     let usersFromPoll = 0;
  //     users.forEach(element => {
  //         if (element.isFromPool === 'Y'){
  //             usersFromPoll++;
  //         }
  //     });
  //     return usersFromPoll;
  // }

  // private countActiveUsers (users: User[]): number {
  //     let activUserNumber = 0;
  //     users.forEach(element => {
  //         if (element.isActive === 'Y'){
  //             activUserNumber ++;
  //         }
  //     });
  //     return activUserNumber;
  // }


  //   private countEmployedUsers(users: User[]): number {
  //     let emplyedUser = 0;
  //     users.forEach(element => {
  //         if (element.isEmployed === 'Y') {
  //             emplyedUser++;
  //         }       
  //     });
  //     return emplyedUser;
  // }
}
