import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthenticationService, UserService } from '../_services/index';


@Component({
    selector: 'app-user-reset-password',
    templateUrl: './user-reset-password.component.html',
    styleUrls: ['./user-reset-password.component.css']
})
export class UserResetPasswordComponent implements OnInit {

    sendToEmailAddress: string;

    hash: string;
    userId: string;
    newPassword: string;

    constructor(private route:ActivatedRoute,
                private router:Router,
                private userService: UserService,
                private authenticationService:AuthenticationService,
                private alertService:AlertService) {
    }

    ngOnInit() {

        this.hash = this.route.snapshot.queryParams['hash'];
        this.userId = this.route.snapshot.queryParams['id'];
    }

    public sendResetMail():void {
        console.log("Reseting pass for: "+this.sendToEmailAddress);
        this.userService.sendResetEmail(this.sendToEmailAddress).subscribe(response => this.sendEmailStatusNotification(response, this.sendToEmailAddress));
    }

    private sendEmailStatusNotification(response:any, sendToEmailAddress:string):void {
        if (response && response.success && response.success === 1) {
            this.alertService.info("Wysłano wiadomość na adres "+sendToEmailAddress+" z instrukcją zmiany hasła");
        } else {
            this.alertService.error("Nie udało się wysłać wiadomości na adres "+sendToEmailAddress);
        }
    }

    public resetPassword(): void {
        this.userService.resetPassword(this.userId, this.hash, this.newPassword).subscribe(response => this.resetPasswordStatusNotification(response));
    }

    private resetPasswordStatusNotification(response:any):void {
        if (response && response.success && response.success === 1) {
            this.alertService.success("Hasła zostało zmienione.");
            this.router.navigate(['/logme']);
        } else {
            this.alertService.error("Nie udało się zmienić hasła, sprawdz link ze skrzynki email");
        }
    }
}
