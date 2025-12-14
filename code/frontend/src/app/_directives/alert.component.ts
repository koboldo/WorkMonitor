import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from 'primeng/api';

import { AlertService, AuthenticationService } from '../_services/index';
import { User } from '../_models/user';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent implements OnDestroy {
    private subscription: Subscription;
    private subLogin: Subscription;

    growlMsgs: Message[] = [];
    lastMessage: Message[] = [];
    constructor(private alertService: AlertService, private authService: AuthenticationService) {
        // subscribe to alert messages
        this.subscription = alertService.getMessage().subscribe(message => this.handleMessage(message));
        this.subLogin = this.authService.userAsObs.subscribe(user => this.clean(user));
    }

    ngOnDestroy(): void {
        // unsubscribe on destroy to prevent memory leaks
        this.subscription.unsubscribe();
        this.subLogin.unsubscribe();
        this.clean(null);
    }

    public clean(user: User):void {
        console.log("Cleaning message cause user has changed!" + JSON.stringify(user));
        this.lastMessage = [];
    }

    private handleMessage(message: Message):void {
        if (message !== undefined) {

            console.log("growl: "+JSON.stringify(message)  );
            this.growlMsgs.push(message);           
            this.lastMessage.push(message);

            setTimeout(() =>
                {
                    this.removeGrowl(message);
                },
                10000);
        }
        else {
            this.lastMessage = [];
        }
 
    }

    private removeGrowl(message:Message):void {
        let newMessages: Message[] = [];
        for (let m of this.growlMsgs) {
            if (m.detail !== message.detail) {
                newMessages.push(m);
            }
        }
        this.growlMsgs = newMessages;
    }
}