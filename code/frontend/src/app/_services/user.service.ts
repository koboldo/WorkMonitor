import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User, Order, UserReport } from '../_models/index';
import { HttpInterceptor } from '../_services/httpInterceptor.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';

@Injectable()
export class UserService {
    constructor(private http: HttpInterceptor, private dictService: DictService) {
        console.log("created UserService");
    }

    getAll() {
        return this.http.get('/api/v1/persons').map((response: Response) => response.json());
    }

    getById(id: number) {
        return this.http.get('/api/v1/persons/' + id).map((response: Response) => response.json());
    }

    create(user: User) {
        return this.http.post('/api/v1/persons', user).map((response: Response) => response.json());
    }

    update(user: User) {
        let strippedUser: User = JSON.parse(JSON.stringify(user));
        strippedUser.workOrders = undefined;
        return this.http.put('/api/v1/persons/' + strippedUser.id, strippedUser).map((response: Response) => response.json());
    }

    sendResetEmail(email: string): Observable<any> {
        let msg: any = {};
        msg.email = email;
        return this.http.post('/pwdreset', msg).map((response: Response) => response.json());
    }


    resetPassword(userId:string, hash:string, newPassword:string):any {
        let msg: any = {id: userId, password: newPassword, hash: hash};
        return this.http.put('/pwdreset', msg).map((response: Response) => response.json());
    }

    assignWorkOrder(user: User, order: Order, isNewOrderOwner: boolean):any {
        if (isNewOrderOwner && order.assignee !== undefined && order.assignee.length > 0) {
            return this.addRelation(true, user, order);
        } else {
            return this.addRelation(false, user, order);
        }
    }

    /* sqlite could not handle
    private deleteAllAssignees(assigneeIds: number[], orderId: number) {
        let observableBatch = [];

        for(let assigneeId of assigneeIds) {
            observableBatch.push(
                this.http.delete('/api/v1/persons/' + assigneeId + '/order/'+orderId, this.authService.getAuthOptions()).
                map((response:Response) => this.getRelationDeleteResult(response.json()))
            );
        }

        return Observable.forkJoin(observableBatch);
    }


    getRelationDeleteResult(response: any) : number {
        console.log("delete result= "+JSON.stringify(response));

        if (response.deleted === 1) {
            console.log("Old relation (assignment) removed successfully");
            return 1;
        } else if (response.deleted === 0) {
            console.log("there was no relation deleted - we are optimistic");
            return 1;
        } else {
            console.log("there unimplemented: "+response.deleted);
            return -1;
        }

    }
     */

    private handleError(error: any): Observable<any> {
        console.error('An error occurred: ', error); // for demo purposes only
        return new EmptyObservable();
    }

    private addRelation(detach: boolean, user:User, order:Order):Observable<any> {
        return this.http.post('/api/v1/persons/' + user.id + '/order/' + order.id+(detach?"?detach=true":""), order).map((response:Response) => response.json());
    }

    delete(id: number) {
        return this.http.delete('/api/v1/persons' + id).map((response: Response) => response.json());
    }

    public getUtilizationReportData(dateAfter: string, dateBefore: string): Observable<UserReport[]> {
        return this.http.get('/api//v1/report/personOrders?dateAfter='+dateAfter+"&dateBefore="+dateBefore).map((response: Response) => (response.json().list));
    }

    public getEngineers(): Observable<User[]> {
        return this.http.get('/api/v1/persons').map((response: Response) => this.getAllByRole(response.json(), ["MG", "EN"]));
    }

    public getStaff(): Observable<User[]> {
        return this.http.get('/api/v1/persons').map((response: Response) => this.getAllByRole(response.json(), ["MG", "EN", "OP"]));
    }

    public getManagedUsers(role: string[]): Observable<User[]> {
        if (role && role.indexOf('PR') > -1 ) {
            return this.getStaff();
        } else {
            return this.getEngineers();
        }
    }

    public getVentureRepresentatives(): Observable<User[]> {
        return this.http.get('/api/v1/persons').map((response: Response) => this.getAllByRole(response.json(), ["VE"]));
    }

    private hasAnyRole(sourceRoleCodes: string[], user: User): boolean {
        for (let role of user.roleCode) {
            if (sourceRoleCodes.indexOf(role) > -1) {
                return true;
            }
        }
    }

    // private helper methods
    private getAllByRole(response:any, roleCodes:string[]):User[] {
        let users : User[] = [];

        console.log("getAllByRole for "+JSON.stringify(roleCodes));

        if (response.list && response.list.length > 0) {
            for (let user of response.list) {

                console.log("getAllByRole processing user "+JSON.stringify(user));

                if (user.roleCode && user.roleCode.length && this.hasAnyRole(roleCodes, user)) {


                    if (user.officeCode) {
                        console.log("trying for "+user.officeCode +" from "+JSON.stringify( this.dictService.getOffices() ) );
                        user.office = this.dictService.getOffice(user.officeCode);
                    }

                    user.role = [];
                    for (let roleCode of user.roleCode) {
                        user.role.push(this.dictService.getRole(roleCode));
                    }

                    console.log("getAllByRole pushing user "+JSON.stringify(user));
                    users.push(user);

                }
            }
        }

        return users;
    }

}