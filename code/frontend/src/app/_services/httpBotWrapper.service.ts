import { Http, Request, RequestOptions, RequestOptionsArgs, Response, XHRBackend } from "@angular/http";
import { HttpClient } from '@angular/common/http';
import { HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, AsyncSubject } from "rxjs/Rx";
import { Subject } from 'rxjs/Subject';
import { AlertService, AuthenticationService } from '../_services/index';
import { Router } from '@angular/router';

// operators
import "rxjs/add/operator/catch"
import "rxjs/add/observable/throw"
import "rxjs/add/operator/map"


@Injectable()
export class HttpBotWrapper {


    constructor(
        public http: HttpClient,
        private alertService: AlertService,
        private authSerivce: AuthenticationService,
        private router: Router
    ) {
    }

    progress: Map<string, number> = new Map<string, number>();
    subject = new Subject<Map<string, number>>();

    public getProgress(): Observable<Map<string, number>> {
        return this.subject.asObservable();
    }

    public cleanProgress(): void {
        this.progress = new Map<string, number>();
        this.subject.next(this.progress);
    }

    private getProgressKey(url: string):string {
        return url;
    }


    private incrementProgress(key: string): void {
        let value: number = this.progress.get(key);
        if (value === undefined) {
            this.progress.set(key, 1);
            console.log("progress for "+key +"=1 has been added!");
        } else {
            this.progress.set(key, ++value);
            console.log("progress for "+key +" incremented to "+value);
        }
        this.subject.next(this.progress);
    }

    private decrementProgress(key: string): void {
        let value: number = this.progress.get(key);
        if (value !== undefined) {
            if (value === 1) {
                this.progress.delete(key);
                console.log("progress for "+key +" has been removed!");
            } else {
                this.progress.set(key, --value);
                console.log("progress for "+key +" decremented to "+value);
            }
        } else {
            console.log("key="+key +" not found in "+JSON.stringify(this.progress));
        }
        this.subject.next(this.progress);
    }

    private cache: { [name: string]: AsyncSubject<HttpEvent<any>> } = {};


    public get(url: string, options?: RequestOptionsArgs): Observable<any> {
        this.incrementProgress(this.getProgressKey(url));
        return this.http.get(url, {headers: this.authSerivce.getHttpHeaders()})
            .do(response => this.decrementProgress(this.getProgressKey(url)))
            .catch(e => this.handleError(e, url))
    }

    public post(url: string, object:any, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.post(url, object, {headers: this.authSerivce.getHttpHeaders()})
            .do(response => this.decrementProgress(this.getProgressKey(url)))
            .catch(e => this.handleError(e, url))
    }

    public put(url: string, object:any, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.put(url, object, {headers: this.authSerivce.getHttpHeaders()})
            .do(response => this.decrementProgress(this.getProgressKey(url)))
            .catch(e => this.handleError(e, url))
    }

    public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.delete(url, {headers: this.authSerivce.getHttpHeaders()})
            .do(response => this.decrementProgress(this.getProgressKey(url)))
            .catch(e => this.handleError(e, url))

    }

    public handleError(error: Response, url: string) {
        this.decrementProgress(this.getProgressKey(url));

        console.log("This is an error: "+JSON.stringify(error));
        let body: any = JSON.parse(error["_body"]);

        if(error.status === 403) { //forbidden
            console.log("message: "+body.message);
            if (body !== undefined && body.message === "jwt expired") {
                this.alertService.error("Sesja wygasła");
            } else {
                this.alertService.error("Zostałeś wylogowany z powodu próby nieautoryzowanego dostępu do zasobu!");
            }
            this.router.navigate(['logme']); //navigate home
        } else {
            this.alertService.error("Wewnętrzny bląd: "+ (body !== undefined && body.message ? body.message : ""));
        }

        return Observable.throw(error)
    }

}