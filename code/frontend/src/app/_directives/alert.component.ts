import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {Message} from 'primeng/primeng';

import { AlertService } from '../_services/index';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent implements OnDestroy {
    private subscription: Subscription;
    message: any;
    growlMsgs: Message[] = [];

    constructor(private alertService: AlertService) { 
        // subscribe to alert messages
        this.subscription = alertService.getMessage().subscribe(message => this.handleMessage(message));
    }

    ngOnDestroy(): void {
        // unsubscribe on destroy to prevent memory leaks
        this.subscription.unsubscribe();
    }

    private handleMessage(message:any):void {
        this.message = message;
        if (message !== undefined) {
            let summary: string = "Informacja";
            if (this.message['type'] === "warn") {
                summary = "Ostrzeżenie"
            } else if (this.message['type'] === "error") {
                summary = "Błąd!"
            } else if (this.message['type'] === "success") {
                summary = "Sukces!"
            }
            let growlMessage: Message = <Message> {severity:this.message['type'], summary:'Info Message', detail:this.message['text']};
            this.growlMsgs.push(growlMessage);

            setTimeout(() =>
                {
                    this.removeGrowl(growlMessage);
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