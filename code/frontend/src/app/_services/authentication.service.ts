import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import { User } from '../_models/user';
import { TabMenuModule,MenuItem }  from 'primeng/primeng';

@Injectable()
export class AuthenticationService {

    constructor(private http: HttpClient) { }

    private isLoggedFlag: boolean;
    private menuItems = new BehaviorSubject<MenuItem[]>(null);
    private user = new BehaviorSubject<User>(null);
    private httpHeaders: HttpHeaders;

    get isLogged(): boolean {
        return this.isLoggedFlag;
    }

    get menuItemsAsObs() : Observable<MenuItem[]> {
        return this.menuItems.asObservable();
    }

    get userAsObs(): Observable<User> {
        return this.user.asObservable();
    }

    public getHttpHeaders(): HttpHeaders {
        return this.httpHeaders
    }


    login(email: string, password: string) {

        let data : User = <User> {
            email: email,
            password: password
        };


        console.log("about to login: "+JSON.stringify(data));

        //proxy!!!
        return this.http.post<User>('/login', JSON.stringify(data), {headers: new HttpHeaders({'Content-Type':'application/json'})})
            .map(user => {
                // login successful if there's a jwt token in the response
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
        this.httpHeaders = new HttpHeaders({'Content-Type':'application/json','x-access-token':token});

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
            {label: 'Zawieszone', icon: 'fa-ban',     routerLink: ['/suspendedWorkOrders'], "rolesRequired":["OP", "PR", "EN", "MG"]},
            {label: 'Anulowane',  icon: 'fa-trash-o', routerLink: ['/cancelledWorkOrders'], "rolesRequired":["OP", "PR", "EN", "MG"]},
            {label: 'Moje zlecenia', icon: 'fa-calendar', routerLink: ['/myWorkOrders'], "rolesRequired":["EN", "MG"]},
            {label: 'Wyceny pracochłonności', icon: 'fa-life-bouy', routerLink: ['/workOrderComplexity'], "rolesRequired":["MG", "PR"]},
            {label: 'Czas pracy', icon: 'fa-clock-o', routerLink: ['/addTimesheet'], "rolesRequired":["OP", "PR", "MG", "EN"]},
            {label: 'Wynagrodzenie', icon: 'fa-money', routerLink: ['/myPayroll'], "rolesRequired":["EN", "MG", "OP"], "rolesForbidden": ["PR"]},
            {label: 'Protokół', icon: 'fa-envelope-open-o', routerLink: ['/clearing'], "rolesRequired":["PR", "CL"]},
            /*{label: 'WO do akceptacji', icon: 'fa-paperclip', routerLink: ['/unacceptedWork'], "rolesRequired":["PR"]}, removed since status Accepted was removed*/
            // {label: 'Wydajność zespołu', icon: 'fa-bar-chart', routerLink: ['/workMonitor'], "rolesRequired":["PR"]},
            {label: 'Wydajność zespołu', icon: 'fa-bar-chart', routerLink: ['/workMonitor'], "rolesRequired":["AN"]},
            {label: 'Wynagrodzenia', icon: 'fa-money', routerLink: ['/payroll'], "rolesRequired":["PR"]},
            {label: 'Pracownicy', icon: 'fa-address-card', routerLink: ['/employees'], "rolesRequired":["PR", "OP"]},
            {label: 'Kontrahenci', icon: 'fa-handshake-o', routerLink: ['/contractors'], "rolesRequired":["PR", "OP"]},
            {label: 'Dodaj osobę', icon: 'fa-user-plus', routerLink: ['/addPerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Zmodyfikuj osobę', icon: 'fa-user-o', routerLink: ['/changePerson'], "rolesRequired":["OP", "PR"]},
            //{label: 'Parametryzacja zleceń', icon: 'fa-server', routerLink: ['/workTypes'], "rolesRequired":["PR"]},
            {label: 'Parametryzacja zleceń', icon: 'fa-cogs', routerLink: ['/workTypes'], "rolesRequired":["PA"]},
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