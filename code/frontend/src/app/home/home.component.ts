import { Component, OnInit } from '@angular/core';

import { TabMenuModule,MenuItem }  from 'primeng/primeng';

import { AlertService, AuthenticationService } from '../_services/index';

import { User } from '../_models/index';

@Component({
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {
    currentUser: User;
    items: MenuItem[];

    constructor(private authService:AuthenticationService) {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }

    ngOnInit() {
        let allItems = [
            {label: 'Praca z WO', icon: 'fa-server', routerLink: ['/workOrders'], "rolesRequired":["OP", "PR"]},
            {label: 'Moje WO', icon: 'fa-calendar', routerLink: ['/myWorkOrders'], "rolesRequired":["EN", "MG"]},
            {label: 'Czas pracy', icon: 'fa-calendar', routerLink: ['/addTimesheet'], "rolesRequired":["OP"]},
            {label: 'Dodaj osobę', icon: 'fa-address-book', routerLink: ['/addPerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Wyceny niestandardowe', icon: 'fa-life-bouy', routerLink: ['/workOrderComplexity'], "rolesRequired":["MG", "PR"]},
            {label: 'Rozliczenie (protokół)', icon: 'fa-object-ungroup', routerLink: ['/clearing'], "rolesRequired":["PR"]},
            {label: 'Monitoring wydajnosci pracowników', icon: 'fa-bar-chart', routerLink: ['/workMonitor'], "rolesRequired":["PR"]},
            {label: 'Niezaakceptowane prace', icon: 'fa-exchange', routerLink: ['/unacceptedWork'], "rolesRequired":["PR"]}
        ];

        this.items = allItems.filter(item => this.filterItem(item));

    }

    private filterItem(item:any):boolean {
        if (item.rolesRequired && item.rolesRequired.indexOf(this.currentUser.roleCode) > -1) {
            return true;
        } else {
            console.log("role "+this.currentUser.roleCode +" has no access to "+item.label);
            return false;
        }
    }

}