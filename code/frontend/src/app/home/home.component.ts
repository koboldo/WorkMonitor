import { Component, OnInit } from '@angular/core';

import { TabMenuModule,MenuItem }  from 'primeng/primeng';

import { AlertService, AuthenticationService } from '../_services/index';

import { User } from '../_models/index';

@Component({
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {

    constructor(private authService:AuthenticationService) {

    }

    ngOnInit() {


    }


}