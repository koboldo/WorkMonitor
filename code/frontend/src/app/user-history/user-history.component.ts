import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

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

  constructor(private toolsService:ToolsService,
              private authenticationService:AuthenticationService,
              private userService:UserService) {
  }

  ngOnInit() {

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