
import { throwError as observableThrowError,  Observable, AsyncSubject ,  Subject } from 'rxjs';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { AuthenticationService } from '../_services/authentication.service';
import { AlertService } from '../_services/alert.service';
import { Router } from '@angular/router';

// operators
import { catchError, map, tap } from 'rxjs/operators';


@Injectable()
export class HttpBotWrapper {


    constructor(
        public http: HttpClient,
        private alertService: AlertService,
        private authSerivce: AuthenticationService,
        private router: Router
    ) {
    }

    public get(url: string): Observable<Object> {
        //return this.http.get(url, {headers: this.authSerivce.getHttpHeaders()}).pipe();
        return this.http.get(url).pipe();

    }

    public post(url: string, object:any): Observable<Object> {
        //return this.http.post(url, object, {headers: this.authSerivce.getHttpHeaders()}).pipe();
        return this.http.post(url, object).pipe();
    }

    public put(url: string, object:any): Observable<Object> {
        //return this.http.put(url, object, {headers: this.authSerivce.getHttpHeaders()}).pipe();
        return this.http.put(url, object).pipe();
    }

    public delete(url: string): Observable<Object> {
        //return this.http.delete(url, {headers: this.authSerivce.getHttpHeaders()}).pipe();
        return this.http.delete(url).pipe();

    }



}