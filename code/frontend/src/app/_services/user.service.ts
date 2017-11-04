import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { User } from '../_models/index';
import { AuthenticationService } from '../_services/authentication.service';
import 'rxjs/add/operator/map';

@Injectable()
export class UserService {
    constructor(private http: Http, private authService: AuthenticationService) {
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

    // private helper methods


}