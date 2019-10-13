import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersDisplayComponent } from '../users-display/users-display.component';
import { AlertService, UserService, DictService, AuthenticationService, ToolsService, UserTimeStatsService } from '../_services/index';
import { User, CodeValue, SearchUser, Timestats } from '../_models/index';
import { SelectItem } from 'primeng/primeng';
import { UserTableSummary } from 'app/_models/userTableSummary';


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
              private userTimeStatsService: UserTimeStatsService) {

    super(router, userService, alertService, dictService, authService);

    this.initMounths();
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

  

  private initMounths() {
    let now = new Date();
    for (let i = 0; i < 12; i++) {
      let d = new Date(now.getFullYear(), now.getMonth(), 1, now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      d.setMonth(d.getMonth() - i);
      let l:string = this.toolsService.formatDate(d, 'yyyy-MM');
      let v:string = this.toolsService.formatDate(d, 'yyyy-MM-dd');
      this.possibleDates.push({label: l, value: v});
      
    }
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

  private processTimestats(timestats:Timestats[]):void {
    this.timestats = timestats;
    this.displayReportResultDialog = true;
   
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
