import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AlertService, UserService, DictService, AuthenticationService } from '../_services/index';
import { User, CodeValue, SearchUser } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime.js';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { FormsModule, FormBuilder, FormGroup, FormControl, EmailValidator, Validators, NG_VALIDATORS, Validator }     from '@angular/forms';

@Component({
    selector: 'app-user-change',
    templateUrl: './user-change.component.html',
    styleUrls: ['./user-change.component.css']
})


export class UserChangeComponent implements OnInit {

    loading:boolean = false;

    roles:SelectItem[] = [];
    offices:SelectItem[] = [];
    ranks:SelectItem[] = [];
    agreements:SelectItem[] = [];

    showRoles:boolean = false;
    showOffices:boolean = false;
    showRanks:boolean = false;
    showAgreements:boolean = false;

    operator:User;

    /* autocompletion changed user */
    users:User[] = [];
    suggestedUsers:SearchUser[];
    selectedUser:SearchUser;

    /* autocompletion company */
    suggestedCompanies: string[];
    company: string;

    rateControl = new FormControl("", [Validators.min(0)]);

    constructor(private router:Router,
                private route: ActivatedRoute,
                private userService:UserService,
                private alertService:AlertService,
                private dictService:DictService,
                private authService:AuthenticationService) {

    }

    ngOnInit():void {

        let id: string = this.route.snapshot.paramMap.get('id'); //can be null

        this.dictService.init();
        this.authService.userAsObs.subscribe(user => this.removeRolesAndGetManagedUsers(user, id));

        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));

        this.mapToRanks(this.dictService.getRanks());
        this.mapToAgreements(this.dictService.getAgreements());

    }

    public onSelectUser(value : SearchUser): void {
        console.log("changing company "+JSON.stringify(value));
        if (value && value.user && value.user.company) {
            this.company = value.user.company;
        }
    }

    suggestUser(event) {
        let suggestedUsers: SearchUser[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;
        if (this.users && this.users.length > 0) {
            for (let user of this.users) {
                let suggestion:string = JSON.stringify(user);
                console.log("suggestUser " + suggestion + " for " + JSON.stringify(event));
                if (suggestion.toLowerCase().indexOf(queryIgnoreCase) > -1) {
                    let displayName:string = user.firstName + " " + user.lastName + " (" + user.role + ")";
                    suggestedUsers.push(new SearchUser(displayName, user));
                    console.log("added suggestUser " + suggestion + " for " + JSON.stringify(user));
                }
            }
        }
        this.suggestedUsers = suggestedUsers;
        //this.selectedUser = undefined;
        console.log("suggestedUsers new " + JSON.stringify(this.suggestedUsers));
    }

    public showProjectFactor() {
        return this.selectedUser && this.operator && this.selectedUser.user.isFromPool === 'Y' && this.operator.roleCode.indexOf('PR') > -1;
    }

    suggestCompany(event) {
        let suggestedCompanies: string[] = [];
        let queryIgnoreCase: string = event.query ? event.query.toLowerCase(): event.query;

        if (this.users && this.users.length > 0) {
            console.log('all ' + JSON.stringify(this.users));
            for (let u of this.users) {
                if (this.selectedUser.user.roleCode.indexOf('VE') == -1 && u.roleCode.indexOf('VE') == -1) {
                    if (u.company && u.company.toLowerCase().indexOf(queryIgnoreCase) > -1 && suggestedCompanies.indexOf(u.company) == -1) {
                        suggestedCompanies.push(u.company);
                    }
                } else if (this.selectedUser.user.roleCode.indexOf('VE') > -1 && u.roleCode.indexOf('VE') > -1) {
                    if (u.company && u.company.toLowerCase().indexOf(queryIgnoreCase) > -1 && suggestedCompanies.indexOf(u.company) == -1) {
                        suggestedCompanies.push(u.company);
                    }
                }
            }
        }
        this.suggestedCompanies = suggestedCompanies;
        console.log('suggestedCompanies: ' + JSON.stringify(this.suggestedCompanies));
    }

    changeUser() {
        this.loading = true;

        if (this.company) {
            this.selectedUser.user.company = this.company;
        }

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

    private mapToRanks(pairs:CodeValue[]):void {
        this.showRanks = this.mapToSelectItem(pairs, this.ranks);
    }

    private mapToAgreements(pairs:CodeValue[]):void {
        this.showAgreements = this.mapToSelectItem(pairs, this.agreements);
    }

    private mapToSelectItem(pairs:CodeValue[], ref:SelectItem[]):boolean {
        for (let pair of pairs) {
            ref.push({label: pair.paramChar, value: pair.code});
        }
        return true;
    }

    private removeRolesAndGetManagedUsers(user:User, id: string):void {
        if (user) {
            this.operator = user;
            console.log("Operator " + JSON.stringify(this.operator));
            if (this.operator.roleCode.indexOf('PR') == -1) {
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
            this.userService.getManagedUsers(user.roleCode, true).subscribe(users => this.setUsersAndSelectedUser(users, id));
        }
    }

    private setUsersAndSelectedUser(users:User[], sId:String):any {
        this.users = users;
        if (sId) {
            let id: number = +sId;
            for(let user of users) {
                if (user.id === id) {
                    console.log("found "+JSON.stringify(user));
                    let displayName:string = user.firstName + " " + user.lastName + " (" + user.role + ")";
                    this.selectedUser = new SearchUser(displayName, user);
                    this.onSelectUser(this.selectedUser);
                }
            }
        }
    }
}
