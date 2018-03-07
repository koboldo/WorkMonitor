import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService, AuthenticationService } from '../_services/index';
import { User, CodeValue, SearchUser } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime.js';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';
import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-users-display',
    templateUrl: './users-display.component.html',
    styleUrls: ['./users-display.component.css']
})
export class UsersDisplayComponent implements OnInit {

    items:MenuItem[] = [];

    operator:User;
    users:User[] = [];
    selectedUser: User;


    constructor(private router:Router,
                private userService:UserService,
                private alertService:AlertService,
                private dictService:DictService,
                private authService:AuthenticationService) {

        this.items = [
            {label: 'Zmień dane pracownika', icon: 'fa-pencil-square-o', disabled: false, command: (event) => this.change()}
        ];

    }

    ngOnInit():void {
        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.removeRolesAndGetManagedUsers(user));
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

    private removeRolesAndGetManagedUsers(user:User):void {
        if (user) {
            this.operator = user;
            this.userService.getStaff().subscribe(engineers => this.users = engineers);
        }
    }

}
