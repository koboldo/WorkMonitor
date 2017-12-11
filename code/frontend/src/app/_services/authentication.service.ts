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

    private menuItems = new BehaviorSubject<MenuItem[]>(null);
    private user = new BehaviorSubject<User>(null);
    private authOptions: RequestOptions;

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
    }

    private buildMenu(user:User):any {

        let allItems = [
            {label: 'Praca z WO', icon: 'fa-server', routerLink: ['/workOrders'], "rolesRequired":["OP", "PR"]},
            {label: 'Moje WO', icon: 'fa-calendar', routerLink: ['/myWorkOrders'], "rolesRequired":["EN", "MG"]},
            {label: 'Kierownica', icon: 'fa-life-bouy', routerLink: ['/workOrderComplexity'], "rolesRequired":["MG", "PR"]},
            {label: 'Czas pracy', icon: 'fa-calendar', routerLink: ['/addTimesheet'], "rolesRequired":["OP", "PR", "MG", "EN"]},
            {label: 'Protokół', icon: 'fa-envelope-open-o', routerLink: ['/clearing'], "rolesRequired":["PR"]},
            {label: 'WO do akceptacji', icon: 'fa-exchange', routerLink: ['/unacceptedWork'], "rolesRequired":["PR"]},
            {label: 'Wydajność zespołu', icon: 'fa-bar-chart', routerLink: ['/workMonitor'], "rolesRequired":["PR"]},
            {label: 'Dodaj osobę', icon: 'fa-user-plus', routerLink: ['/addPerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Zmodyfikuj osobę', icon: 'fa-user-o', routerLink: ['/changePerson'], "rolesRequired":["OP", "PR"]},
            {label: 'Wyloguj', icon: 'fa-sign-out', routerLink: ['/logme'], "rolesRequired":["PR", "OP", "MG", "EN"]}
        ];

        return allItems.filter(item => this.filterItem(item, user));

    }

    private filterItem(item:any, user:User):boolean {
        if (item.rolesRequired && item.rolesRequired.indexOf(user.roleCode) > -1) {
            return true;
        } else {
            console.log("role "+user.roleCode +" has no access to "+item.label);
            return false;
        }
    }
}