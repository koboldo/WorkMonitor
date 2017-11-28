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


@Component({
    selector: 'app-user-change',
    templateUrl: './user-change.component.html',
    styleUrls: ['./user-change.component.css']
})


export class UserChangeComponent implements OnInit {

    loading:boolean = false;

    roles:SelectItem[] = [];
    offices:SelectItem[] = [];

    showRoles:boolean = false;
    showOffices:boolean = false;

    operator:User;

    /* autocompletion changed user */
    users:User[] = [];
    suggestedUsers:SearchUser[];
    selectedUser:SearchUser;

    constructor(private router:Router,
                private userService:UserService,
                private alertService:AlertService,
                private dictService:DictService,
                private authService:AuthenticationService) {

    }

    ngOnInit():void {
        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.removeRolesAndGetManagedUsers(user));

        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));
    }

    suggestUser(event) {
        this.selectedUser = undefined;
        this.suggestedUsers = [];
        if (this.users && this.users.length > 0) {
            for (let user of this.users) {
                let suggestion:string = JSON.stringify(user);
                console.log("suggestUser " + suggestion + " for " + JSON.stringify(event));
                if (suggestion.indexOf(event.query) > -1) {
                    let displayName:string = user.firstName + " " + user.lastName + " (" + user.role + ")";
                    this.suggestedUsers.push(new SearchUser(displayName, user));
                }
            }
        }
        console.log("suggestedUsers " + JSON.stringify(this.suggestedUsers));
    }

    changeUser() {
        this.loading = true;


        this.userService.update(this.selectedUser.user)
            .subscribe(
                data => {
                this.alertService.success('Pomyślnie zmieniono użytkownika ' + this.selectedUser.user.email, true);
                this.router.navigate(['']); //navigate home
            },
                error => {
                this.alertService.error('Nie udalo się zmienić użytkownika' + error);
                this.loading = false;
            });
    }

    private mapToRoles(pairs:CodeValue[]):void {
        this.showRoles = this.mapToSelectItem(pairs, this.roles);
    }

    private mapToOffices(pairs:CodeValue[]):void {
        this.showOffices = this.mapToSelectItem(pairs, this.offices);
    }

    private mapToSelectItem(pairs:CodeValue[], ref:SelectItem[]):boolean {
        for (let pair of pairs) {
            ref.push({label: pair.paramChar, value: pair.code});
        }
        return true;
    }

    private removeRolesAndGetManagedUsers(user:User):void {
        if (user) {
            this.operator = user;
            console.log("Operator " + JSON.stringify(this.operator));
            if (this.operator.roleCode !== 'PR') {
                let roles:CodeValue[] = this.dictService.getRoles();
                let allowedRoles:CodeValue[] = [];
                for (let role of roles) {
                    if (role.code !== 'PR') {
                        allowedRoles.push(role);
                    }
                }
                this.mapToRoles(allowedRoles);

            } else {
                this.mapToRoles(this.dictService.getRoles());
            }
            this.userService.getManagedUsers(user.roleCode).subscribe(engineers => this.users = engineers);
        }
    }
}
