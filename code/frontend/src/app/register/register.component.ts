﻿import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService } from '../_services/index';
import { User, CodeValue } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime.js';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { FormsModule, FormBuilder, FormGroup, EmailValidator, NG_VALIDATORS, Validator }     from '@angular/forms';

@Component({
    templateUrl: 'register.component.html'
})

export class RegisterComponent implements OnInit {

    user: User = new User;
    loading: boolean = false;

    roles: SelectItem[] = [];
    offices: SelectItem[] = [];

    showRoles: boolean = false;
    showOffices: boolean = false;

    representatives: User[];
    suggestedCompanies: string[];
    company: string;

    constructor(
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private dictService: DictService) {

        this.user.roleCode = "EN";
        this.user.officeCode = "WAW";
        this.user.isActive = "Y";



    }

    ngOnInit():void {
        this.dictService.init();
        this.dictService.getRolesObs().subscribe((roles:CodeValue[]) => this.mapToRoles(roles));
        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));
        this.userService.getVentureRepresentatives().subscribe(representatives => this.representatives = representatives);
    }

    register() {
        this.loading = true;

        this.user.isActive = this.user.roleCode === 'VE'? "N" : "Y";
        this.user.company = this.company;

        this.userService.create(this.user)
            .subscribe(
                data => {
                    this.alertService.success('Pomyślnie dodano nowego użytkownika '+this.user.email, true);
                    this.router.navigate(['']); //navigate home
                },
                error => {
                    this.alertService.error('Nie udalo się dodać użytkownika' +error);
                    this.loading = false;
                });
    }

    private mapToRoles(pairs:CodeValue[]):void {
        this.showRoles = this.mapToSelectItem(pairs, this.roles);
    }

    private mapToOffices(pairs:CodeValue[]):void {
        this.showOffices = this.mapToSelectItem(pairs, this.offices);
    }

    private mapToSelectItem(pairs:CodeValue[], ref: SelectItem[]):boolean {
        for(let pair of pairs) {
            ref.push({label: pair.paramChar, value: pair.code});
        }
        return true;
    }

    suggestCompany(event) {
        console.log("all " + JSON.stringify(this.representatives));

        this.suggestedCompanies = <string[]> [];
        if (this.representatives && this.representatives.length > 0) {
            for (let r of this.representatives) {
                if (r.company.indexOf(event.query) > -1) {
                    this.suggestedCompanies.push(r.company);
                }
            }
        }
        console.log("suggestedCompanies: " + JSON.stringify(this.suggestedCompanies));
    }
}
