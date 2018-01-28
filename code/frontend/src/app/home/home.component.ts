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
        if (user && user.roleCode !== undefined && user.roleCode.length > 0) {

            console.log("roleCode "+JSON.stringify(user));

            if (user.roleCode.indexOf("PR") > -1 || user.roleCode.indexOf("OP") > -1) {
                this.router.navigate(['workOrders']);
            } else if (user.roleCode.indexOf("EN") > -1 || user.roleCode.indexOf("MG") > -1) {
                this.router.navigate(['myWorkOrders']);
            } else {
                this.alertService.error("Niezaimplementowana rola "+JSON.stringify(user.roleCode)+" użytkownika");
                this.router.navigate(['logme']);
            }
        }
    }
}