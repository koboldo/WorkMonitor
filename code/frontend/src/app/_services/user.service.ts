import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User } from '../_models/index';
import { AuthenticationService } from '../_services/authentication.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs/Observable';
import 'rxjs/add/operator/map';

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