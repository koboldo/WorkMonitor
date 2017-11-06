import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService, DictService } from '../_services/index';
import { User, CodeValue } from '../_models/index';
import {SelectItem} from 'primeng/primeng'
import {FormsModule} from '@angular/forms';

@Component({
    templateUrl: 'register.component.html'
})

export class RegisterComponent {

    user: User = new User;
    loading = false;

    roles: SelectItem[] = [];
    offices: SelectItem[] = [];

    constructor(
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private dictService: DictService) {

        this.user.roleCode = "EN";
        this.user.officeCode = "WAW";
        this.user.isActive = "Y";

        this.dictService.getRolesObs().subscribe((roles:CodeValue[]) => this.mapToSelectItem(roles, this.roles));
        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToSelectItem(offices, this.offices));
    }

    register() {
        this.loading = true;
        this.userService.create(this.user)
            .subscribe(
                data => {
                    this.alertService.success('Pomyślnie dodano nowego użytkownika '+this.user.login, true);
                    this.router.navigate(['']);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }

    private mapToSelectItem(roles:CodeValue[], ref: SelectItem[]):void {
        for(let role of roles) {
            ref.push({label: role.paramChar, value: role.code});
        }

    }


}
