import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Message } from 'primeng/primeng';

import { AlertService } from '../_services/index';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent implements OnDestroy {
    private subscription: Subscription;

    growlMsgs: Message[] = [];
    lastMessage: Message[];

    constructor(private alertService: AlertService) { 
        // subscribe to alert messages
        this.subscription = alertService.getMessage().subscribe(message => this.handleMessage(message));
    }

    ngOnDestroy(): void {
        // unsubscribe on destroy to prevent memory leaks
        this.subscription.unsubscribe();
    }

    private handleMessage(message: Message):void {
        if (message !== undefined) {

            console.log("growl: "+JSON.stringify(message)  );
            this.growlMsgs.push(message);
            this.lastMessage = [];
            this.lastMessage.push(message);

            setTimeout(() =>
                {
                    this.removeGrowl(message);
                },
                10000);
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