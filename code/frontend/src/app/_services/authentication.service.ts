import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { User } from '../_models/user';

@Injectable()
export class AuthenticationService {
    constructor(private http: Http) { }

    login(username: string, password: string) {

        let data : User = <User> {
            username: username,
            password: password
        };


        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });

        console.log("about to login: "+JSON.stringify(data));

        //return this.http.post('http://127.0.0.1:8080/login', data) we are using proxy
        return this.http.post('/login', JSON.stringify(data), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user : User = <User> response.json();
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(user));
                }

                return user;
            });
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
    }
}