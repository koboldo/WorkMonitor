﻿import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TabMenuModule,MenuItem }  from 'primeng/primeng';

import { AlertService, AuthenticationService, DictService } from './_services/index';

import { User } from './_models/index';


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})

export class AppComponent {

    user: User;

    items: MenuItem[];

    role: Observable<string>;

    constructor(private authService:AuthenticationService, private dictService: DictService) {

    }

    ngOnInit() {
        this.authService.userAsObs.subscribe((user: User) => setTimeout(() => this.setUser(user)));
        this.authService.menuItemsAsObs.subscribe(menuItems => setTimeout(() => this.items = menuItems));
    }


    private setUser(user:User):void {
        if (user) {
            this.user = user;
            this.role = this.dictService.getRoleObs(user.roleCode);
        }
    }
}