import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import { User } from '../_models/user';
import { TabMenuModule,MenuItem }  from 'primeng/primeng';

@Injectable()
export class AuthenticationService {

    constructor(private http: Http) { }

    private isLoggedFlag: boolean;
    private menuItems = new BehaviorSubject<MenuItem[]>(null);
    private user = new BehaviorSubject<User>(null);
    private authOptions: RequestOptions;

    get isLogged(): boolean {
        return this.isLoggedFlag;
    }

    get menuItemsAsObs() : Observable<MenuItem[]> {
        return this.menuItems.asObservable();
    }

    get userAsObs(): Observable<User> {
        return this.user.asObservable();
    }

    public getAuthOptions(): RequestOptions {
        return this.authOptions;
    }


    login(email: string, password: string) {

        let data : User = <User> {
            email: email,
            password: password
        };

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });

        console.log("about to login: "+JSON.stringify(data));

        //proxy!!!
        return this.http.post('/login', JSON.stringify(data), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user : User = <User> response.json();
                if (user && user.token) {
                    this.user.next(user);
                    this.menuItems.next(this.buildMenu(user));
                    this.initAuthHeaders(user.token);
                    this.isLoggedFlag = true;
                }

                return user;
            });
    }

    private initAuthHeaders(token: string) {
        let headers: Headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append("x-access-token",  token);
        this.authOptions = new RequestOptions({ headers: headers });

    }

    logout() {
        console.log("Logging out!");
        this.menuItems.next(null);
        this.user.next(null);
        this.isLoggedFlag = false;
    }

    private buildMenu(user:User):any {

        let allItems = [
            {label: 'Zlecenia', icon: 'fa-server', routerLink: ['/workOrders'], "rolesRequired":["OP", "PR", "EN", "MG"]},
            {label: 'Zawieszone', icon: 'fa-trash-o', routerLink: ['/suspendedWorkOrders'], "rolesRequired":["OP", "PR"]},
            {label: 'Moje zlecenia', icon: 'fa-calendar', routerLink: ['/myWorkOrders'], "rolesRequired":["EN", "MG"]},
            {label: 'Wyceny pracochłonności', icon: 'fa-life-bouy', routerLink: ['/workOrderComplexity'], "rolesRequired":["MG", "PR"]},
            {label: 'Czas pracy', icon: 'fa-clock-o', routerLink: ['/addTimesheet'], "rolesRequired":["OP", "PR", "MG", "EN"]},
            {label: 'Wynagrodzenie', icon: 'fa-money', routerLink: ['/myPayroll'], "rolesRequired":["EN", "MG", "OP"], "rolesForbidden": ["PR"]},
            {label: 'Protokół', icon: 'fa-envelope-open-o', routerLink: ['/clearing'], "rolesRequired":["PR"]},
            /*{label: 'WO do akceptacji', icon: 'fa-paperclip', routerLink: ['/unacceptedWork'], "rolesRequired":["PR"]}, removed since status Accepted was removed*/
            {label: 'Wydajność zespołu', icon: 'fa-bar-chart', routerLink: ['/workMonitor'], "rolesRequired":["PR"]},
            {label: 'Wynagrodzenia', icon: 'fa-money', routerLink: ['/payroll'], "rolesRequired":["PR"]},
            {label: 'Pracownicy', icon: 'fa-address-card', routerLink: ['/employees'], "rolesRequired":["PR"]},
            {label: 'Dodaj osobę', icon: 'fa-user-plus', routerLink: ['/addPerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Zmodyfikuj osobę', icon: 'fa-user-o', routerLink: ['/changePerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Parametryzacja zleceń', icon: 'fa-server', routerLink: ['/workTypes'], "rolesRequired":["PR"]},
            /*{label: 'Wyloguj', icon: 'fa-sign-out', routerLink: ['/logme'], "rolesRequired":["PR", "OP", "MG", "EN"]}*/
        ];

        return allItems.filter(item => this.filterItem(item, user));

    }

    private filterItem(item:any, user:User):boolean {
        if (item.rolesForbidden) {
            for (let roleCode of user.roleCode) {
                if (item.rolesForbidden.indexOf(roleCode) > -1) {
                    return false;
                }
            }
        }

        if (item.rolesRequired ) {
            for (let roleCode of user.roleCode) {
                if (item.rolesRequired.indexOf(roleCode) > -1) {
                    return true;
                }
            }
        } else {
            console.log("roles "+JSON.stringify(user.roleCode) +" has no access to "+item.label);
            return false;
        }
    }
}