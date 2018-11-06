import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TabMenuModule,MenuItem,MenubarModule }  from 'primeng/primeng';

import { AlertService, AuthenticationService, DictService, AutoLogoutService, WorkTypeService } from './_services/index';

import { User } from './_models/index';


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})

export class AppComponent {

    user: User;

    items: MenuItem[];
    hierarchyItems: MenuItem[];

    roles: Observable<string[]>;
    office: Observable<string>;

    constructor(private authService:AuthenticationService,
                private dictService: DictService,
                private workTypeService: WorkTypeService,
                private autoLogoutService: AutoLogoutService) {

    }

    ngOnInit() {
        this.workTypeService.init();
        this.authService.userAsObs.subscribe((user: User) => setTimeout(() => this.setUser(user)));
        this.authService.menuItemsAsObs.subscribe(menuItems => setTimeout(() => this.items = menuItems));
        this.authService.hierarchyItemsAsObs.subscribe(hierarchyItems => setTimeout(() => this.hierarchyItems = hierarchyItems));
    }


    private setUser(user:User):void {
        this.user = user;
        if (user) {
            this.roles = this.dictService.getRoleObs(user.roleCode);
            this.office = this.dictService.getOfficeObs(user.officeCode);
        }
    }

    public getMinutesBeforeLogout() {
        return this.autoLogoutService.getMinutesBeforeLogout();
    }
}