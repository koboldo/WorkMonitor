import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersDisplayComponent } from '../users-display/users-display.component';
import { AlertService, UserService, DictService, AuthenticationService, ToolsService, UserTimeStatsService } from '../_services/index';
import { User, CodeValue, SearchUser, Timestats } from '../_models/index';
import { SelectItem } from 'primeng/primeng';


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

  constructor(protected router:Router,
              protected userService:UserService,
              protected alertService:AlertService,
              protected dictService:DictService,
              protected authService:AuthenticationService,
              private toolsService: ToolsService,
              private userTimeStatsService: UserTimeStatsService) {

    super(router, userService, alertService, dictService, authService);

    this.initMounths();

  }

  private initMounths() {
    for (let i = 0; i < 12; i++) {
      let d = new Date();
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
    this.userTimeStatsService.getByDateAndUserIds(this.users, this.selectedDate, ids).subscribe(timestats => this.processTimestats(timestats))
  }

  private processTimestats(timestats:Timestats[]):void {
    this.timestats = timestats;
    this.displayReportResultDialog = true;
  }
}
