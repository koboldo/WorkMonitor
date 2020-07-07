import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, OrderHistory, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.component.html',
  styleUrls: ['./user-history.component.css']
})
export class UserHistoryComponent implements OnInit {

  public CURRENT_EOF = "3000-01-01 00:00:00";

  _selectedUser:User;
  _staff:User[];
  userHistory:User[];
  cols: any;

  constructor(private toolsService:ToolsService,
              private authenticationService:AuthenticationService,
              private userService:UserService) {
  }

  ngOnInit() {
    this.cols = [
      { field: 'none', excludeGlobalFilter: true, class:"width-10 col-icon text-center", icon:true, button:true},
      { field: 'id', header: 'Id bazy' ,hidden:true, class:"width-20 text-center"},
      { field: 'excelId', header: 'Id excel',hidden:true, sortable:true, class:"width-50 text-center"},          
      { field: 'lastName', header: 'Osoba' ,filter: true, class:"width-50 text-center", user:true, icon:true},
      { field: 'office', header: 'Biuro', sortable:true, class:"width-35 text-center"},
      { field: 'role', header: 'Rola', sortable:true, class:"width-35 text-center"},
      { field: 'rank', header: 'Stopień', sortable:true, class:"width-35 text-center"},
      { field: 'isFromPool', header: 'Pula', sortable:true ,filter:true, class:"width-35 text-center", isFromPool:true, icon:true},
      { field: 'projectFactor', header: 'Współczynnik', sortable:true, class:"width-35 text-center"},
      { field: 'salary', header: 'Wynagrodzenie', sortable:true, class:"width-35 text-center"},
      { field: 'salaryRate', header: 'St. gwarantowana', sortable:true, class:"width-35 text-center"},
      { field: 'leaveRate', header: 'St. za urlop', sortable:true, class:"width-35 text-center"},

      { field: 'histCreationDate', header: 'Zarchiwizowany', sortable:true, class:"width-50 text-center", histCreationDate:true, icon:true},
      { field: 'lastModDate', header: 'Obowiązujący od', sortable:true, class:"width-50 text-center", lastModDate:true, icon:true},
    ]
  }


  @Input()
  set selectedUser(user:User) {
    if (user) {
      console.log('got user: ', user.id);
      this._selectedUser = user;
      this.userService.getHistoryById(user.id).subscribe((history:User[]) => this.processUserHistory(history));
    }
  }

  @Input()
  set staff(staff:User[]) {
    if (staff) {
      console.log('got staff: ', staff.length);
      this._staff = staff;
    }
  }

  private processUserHistory(history:User[]):any {
    this.userHistory = history;

    //let current: User = JSON.parse(JSON.stringify(this._selectedUser, this.toolsService.censorUser));
    let current: User = JSON.parse(JSON.stringify(this._selectedUser));
    current.histCreationDate = this.CURRENT_EOF;
    this.userHistory.push(current); //add current record

    for(let user of this.userHistory) {

      for (let modifiedBy of this._staff) {
        if (user.modifiedBy == modifiedBy.id) {
          user.modifiedByUser = modifiedBy;
        }
      }

    }
  }
}