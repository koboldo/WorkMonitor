import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { AuthenticationService, ProgressService }    from '../_services/index';
import { User } from '../_models/user';

@Component({
    selector: 'app-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {

    private subscription:Subscription;
    private subLogin: Subscription;

    isInProgress: boolean;

    constructor(private progressService:ProgressService, private authService: AuthenticationService) {
    }

    ngOnInit() {
        this.subscription = this.progressService.getSubject().subscribe(progress => setTimeout(() => this.handleProgress(progress)));
        this.subLogin = this.authService.userAsObs.subscribe(user => this.clean(user));
    }

    ngOnDestroy(): void {
        // unsubscribe on destroy to prevent memory leaks
        this.subscription.unsubscribe();
        this.subLogin.unsubscribe();
        this.clean(null);
    }

    public clean(user: User):void {
        console.log("Cleaning progress cause user has changed!" + JSON.stringify(user));
        this.isInProgress = false;
        this.progressService.cleanProgress();
    }


    private handleProgress(progress:Map<string, number>):void {
        this.isInProgress = progress.size > 0;

        if (this.isInProgress) {
            console.log("in progress "+JSON.stringify(progress));
        }

    }
}
