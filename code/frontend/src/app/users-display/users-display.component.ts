import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService, AuthenticationService } from '../_services/index';
import { User, CodeValue, SearchUser } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';

import { Observable }    from 'rxjs';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';
import { MenuItem } from 'primeng/primeng';
import { userTableSummary } from 'app/_models/userTableSummary';

@Component({
    selector: 'app-users-display',
    templateUrl: './users-display.component.html',
    styleUrls: ['./users-display.component.css']
})
export class UsersDisplayComponent implements OnInit {

    items:MenuItem[] = [];

    operator:User;
    allUsers:User[] = [];
    users:User[] = [];
    selectedUser: User;
    summary: userTableSummary;


    displayUserHistoryDialog: boolean;
    employedOnlyFilter: string = 'EMPLOYED_ONLY';

    constructor(protected router:Router,
                protected userService:UserService,
                protected alertService:AlertService,
                protected dictService:DictService,
                protected authService:AuthenticationService) {

        this.items = [
            {label: 'Zmień dane pracownika', icon: 'fa fa-pencil-square-o', disabled: false, command: (event) => this.change()}
        ];

    }

    ngOnInit():void {
        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.removeRolesAndGetManagedUsers(user));
    }

    public showUserHistory(event, user: User): void {
        console.log('showUserHistory... '+JSON.stringify(user));
        this.selectedUser = user;
        this.displayUserHistoryDialog=true;
    }

    public add():void {
        this.router.navigate(['/addPerson']);
    }

    onRowDblclick(event) {
        this.change();
    }

    public change():void {
        if (this.selectedUser && this.selectedUser.id) {
            this.router.navigate(['/changePerson', this.selectedUser.id]);
        } else {
            this.router.navigate(['/changePerson']);
        }
    }

    filter(input): void {
        console.log('radio clicked '+this.employedOnlyFilter+ ' '+JSON.stringify(input));
        //this is shame, onClick is triggerd before model is changed therefore I will rely on input...
        if (input === 'ALL') {
            this.users = this.allUsers;
            
        } else if (input === this.employedOnlyFilter) {
            this.users = [];
            for(let user of this.allUsers) {
                if (user.isEmployed === 'Y') {
                    this.users.push(user);
                }
            }
           
        } else {
            this.users = [];
            console.log(input + ' unimplemented!');
        }
        this.summary = this.creatSummary(this.users);
    }

    private removeRolesAndGetManagedUsers(user:User):void {
        if (user) {
            this.operator = user;
            this.userService.getStaff().subscribe(engineers => this.processUsers(engineers));
        }
    }

    private processUsers(engineers:User[]):void {
        this.allUsers = engineers;
        this.filter(this.employedOnlyFilter);       
    }

    private creatSummary (users: User[]) : userTableSummary {
        console.log(users);
        let summary = new userTableSummary();
        summary.totalActiveUsers = this.countActiveUsers(users);
        summary.totalEmployees = this.countEmployedUsers(users);
        summary.totalUsersFromPool = this.countUsersInPool(users);
        users.forEach(element => {
          if (element.rankCode === 'YOU'){
              summary.totalYOURank ++;
          }
          if (element.rankCode === 'SEN'){
              summary.totalSENRank ++;
          }
          if (element.rankCode === 'REG'){
              summary.totalREGRank ++;
          }
          if (element.rankCode === 'NONE'){
              summary.totalNONERank ++;
          }
          if (element.rank === 'DZI'){
              summary.totalDZIRank ++;
          }
        });
        return summary;
      }
  
      private countUsersInPool (users: User[]): number {
        let usersFromPoll = 0;
        users.forEach(element => {
            if (element.isFromPool === 'Y'){
                usersFromPoll++;
            }
        });
        return usersFromPoll;
    }
  
    private countActiveUsers (users: User[]): number {
        let activUserNumber = 0;
        users.forEach(element => {
            if (element.isActive === 'Y'){
                activUserNumber ++;
            }
        });
        return activUserNumber;
    }
  
  
      private countEmployedUsers(users: User[]): number {
        let emplyedUser = 0;
        users.forEach(element => {
            if (element.isEmployed === 'Y') {
                emplyedUser++;
            }       
        });
        return emplyedUser;
    }
}
