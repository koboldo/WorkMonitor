import {Component} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {TabMenuModule} from 'primeng/tabmenu';
import {MenubarModule} from 'primeng/menubar';
import {MenuItem} from 'primeng/api';
import {AlertService, AuthenticationService, DictService, AutoLogoutService, WorkTypeService, ClientDeviceService} from './_services/index';
import {User} from './_models/index';



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

  constructor(private authService: AuthenticationService,
              private dictService: DictService,
              private workTypeService: WorkTypeService,
              private autoLogoutService: AutoLogoutService,
              public clientDeviceService: ClientDeviceService) {

  }

  ngOnInit() {
    this.workTypeService.init();
    this.authService.userAsObs.subscribe((user: User) => setTimeout(() => this.setUser(user)));
    this.authService.menuItemsAsObs.subscribe(menuItems => setTimeout(() => this.items = menuItems));
    this.authService.hierarchyItemsAsObs.subscribe(hierarchyItems => setTimeout(() => this.hierarchyItems = hierarchyItems));
  }


  private setUser(user: User): void {
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