import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User, Order } from '../_models/index';
import { AuthenticationService } from '../_services/authentication.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class UserService {
    constructor(private http: Http, private authService: AuthenticationService, private dictService: DictService) {
        console.log("WOService options: " + JSON.stringify(this.authService.getAuthOptions()));
    }

    getAll() {
        return this.http.get('/api/v1/persons', this.authService.getAuthOptions()).map((response: Response) => response.json());
    }

    getById(id: number) {
        return this.http.get('/api/v1/persons' + id, this.authService.getAuthOptions()).map((response: Response) => response.json());
    }

    create(user: User) {
        return this.http.post('/api/v1/persons', user, this.authService.getAuthOptions()).map((response: Response) => response.json());
    }

    update(user: User) {
        return this.http.put('/api/v1/persons' + user.id, user, this.authService.getAuthOptions()).map((response: Response) => response.json());
    }

    assignWorkOrder(user: User, order: Order, isNewOrderOwner: boolean):any {
        if (isNewOrderOwner) {
            return this.http.delete('/api/v1/persons/' + user.id + '/order/'+order.id, this.authService.getAuthOptions())
                .map((response:Response) => this.getRelationDeleteResult(response.json()))
                //.catch(this.handleError)
                .mergeMap( deleteResult => this.addRelation(deleteResult, user, order) );

        } else {
            return this.addRelation(1, user, order);
        }
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

    private handleError(error: any): Observable<any> {
        console.error('An error occurred: ', error); // for demo purposes only
        return new EmptyObservable();
    }

    private addRelation(deleteResult:number, user:User, order:Order):any {
        if (deleteResult === 1) {
            return this.http.post('/api/v1/persons/' + user.id + '/order/' + order.id, order, this.authService.getAuthOptions()).map((response:Response) => response.json());
        } else {
            console.log("Cannot add due to deleteResult="+deleteResult);
        }

    }

    delete(id: number) {
        return this.http.delete('/api/v1/persons' + id, this.authService.getAuthOptions()).map((response: Response) => response.json());
    }

    public getEngineers(): Observable<User[]> {
        return this.http.get('/api/v1/persons', this.authService.getAuthOptions()).map((response: Response) => this.getAllByRole(response.json(), ["MG", "EN"]));
    }

    // private helper methods
    private getAllByRole(response:any, roleCodes:string[]):User[] {
        let users : User[] = [];

        if (response.list && response.list.length > 0) {
            for (let user of response.list) {

                if (user.roleCode && roleCodes.indexOf(user.roleCode) > -1) {

                    if (user.officeCode) {
                        console.log("trying for "+user.officeCode +" from "+JSON.stringify( this.dictService.getOffices() ) );
                        user.office = this.dictService.getOffice(user.officeCode);
                    }

                    if (user.roleCode) {
                        user.role = this.dictService.getRole(user.roleCode);
                    }

                    users.push(user);

                }
            }
        }

        return users;
    }

}