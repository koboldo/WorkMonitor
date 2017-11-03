import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TabMenuModule,MenuItem }  from 'primeng/primeng';

import { AlertService, AuthenticationService } from './_services/index';

import { User } from './_models/index';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})

export class AppComponent {

    user: User;

    items: MenuItem[];

    constructor(private authService:AuthenticationService) {

    }

    ngOnInit() {
        this.authService.userAsObs.subscribe(user => setTimeout(() => this.user = user));
        this.authService.menuItemsAsObs.subscribe(menuItems => setTimeout(() => this.items = menuItems));
    }


}