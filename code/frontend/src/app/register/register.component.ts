import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService } from '../_services/index';
import { User, CodeValue } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import {FormsModule} from '@angular/forms';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime.js';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';

@Component({
    templateUrl: 'register.component.html'
})

export class RegisterComponent {


    user: User = new User;
    loading: boolean = false;

    roles: SelectItem[] = [];
    offices: SelectItem[] = [];

    showRoles: boolean = false;
    showOffices: boolean = false;

    constructor(
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private dictService: DictService) {

        this.user.roleCode = "EN";
        this.user.officeCode = "WAW";
        this.user.isActive = "Y";

        this.dictService.getRolesObs().subscribe((roles:CodeValue[]) => this.mapToRoles(roles));
        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));
    }

    register() {
        this.loading = true;
        this.userService.create(this.user)
            .subscribe(
                data => {
                    this.alertService.success('Pomyślnie dodano nowego użytkownika '+this.user.login, true);
                    this.router.navigate(['']); //navigate home
                },
                error => {
                    this.alertService.error(error);
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


}
