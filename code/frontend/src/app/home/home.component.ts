import { Component, OnInit } from '@angular/core';

import { TabMenuModule,MenuItem }  from 'primeng/primeng';

import { AlertService, AuthenticationService } from '../_services/index';

import { User } from '../_models/index';
import { Router } from '@angular/router';

@Component({
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {

    user: User;

    constructor(
        private authService:AuthenticationService,
        private alertService: AlertService,
        private router: Router) {

    }

    ngOnInit() {
        this.authService.userAsObs.subscribe(user => this.redirect(user));

    }


    private redirect(user:User):void {
        if (user && user.roleCode !== undefined) {
            if (user.roleCode === "PR" || user.roleCode === "OP") {
                this.router.navigate(['workOrders']);
            } else if (user.roleCode === "EN" || user.roleCode === "MG") {
                this.router.navigate(['myWorkOrders']);
            } else {
                this.alertService.error("Niezaimplementowana rola "+user.role+" użytkownika");
                this.router.navigate(['logme']);
            }
        }
    }
}