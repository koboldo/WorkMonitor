import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from '../_services/authentication.service';

const MINUTES_UNITL_AUTO_LOGOUT:number = 15 ; // in mins
const CHECK_INTERVAL:number = 60001; // in ms
const STORE_KEY:string = 'lastAction';

@Injectable()
export class AutoLogoutService {

    minutesBeforeLogout = new BehaviorSubject<number>(null);

    getMinutesBeforeLogout():Observable<number> {
        return this.minutesBeforeLogout.asObservable();
    }

    get lastAction(): number {
        return parseInt(localStorage.getItem(STORE_KEY));
    }
    set lastAction(value: number) {
        let sValue: string = ""+value;
        localStorage.setItem(STORE_KEY, sValue);
    }

    constructor(private authService: AuthenticationService,
                private router: Router) {
        console.log("AutoLogoutService init!");
        this.check();
        this.initListener();
        this.initInterval();
    }

    initListener() {
        document.body.addEventListener('click', () => this.reset());
    }

    reset() {
        this.lastAction = Date.now();
        const now = Date.now();
        const timeleft = this.lastAction + MINUTES_UNITL_AUTO_LOGOUT * 60 * 1000;
        const diff = timeleft - now;
        this.minutesBeforeLogout.next(Math.round(((diff % 86400000.0) % 3600000.0) / 60000.0));
    }

    initInterval() {
        setInterval(() => {this.check();}, CHECK_INTERVAL);
    }


    check() {
        console.log("check if should be still logged!");
        const now = Date.now();
        const timeleft = this.lastAction + MINUTES_UNITL_AUTO_LOGOUT * 60 * 1000;
        const diff = timeleft - now;
        const isTimeout = diff < 0;

        if (isTimeout && this.authService.isLogged) {
            console.log("Logging out due to inactivity!");
            this.authService.logout();
            this.router.navigate(['/logme']);
        } else {
            this.minutesBeforeLogout.next(Math.round(((diff % 86400000.0) % 3600000.0) / 60000.0));
        }
    }


}