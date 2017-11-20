import { Http, Request, RequestOptions, RequestOptionsArgs, Response, XHRBackend } from "@angular/http"
import { Injectable } from "@angular/core"
import { Observable } from "rxjs/Rx"
import { AlertService, AuthenticationService } from '../_services/index';
import { Router } from '@angular/router';

// operators
import "rxjs/add/operator/catch"
import "rxjs/add/observable/throw"
import "rxjs/add/operator/map"

@Injectable()
export class HttpInterceptor {

    constructor(
        backend: XHRBackend,
        options: RequestOptions,
        public http: Http,
        private alertService: AlertService,
        private authSerivce: AuthenticationService,
        private router: Router
    ) {
    }

    public get(url: string, options?: RequestOptionsArgs): Observable<Response> {
        console.log("HttpInterceptor get" + url);
        return this.http.get(url, this.authSerivce.getAuthOptions())
            .catch(this.handleError)
    }

    public post(url: string, object:any, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.post(url, object, this.authSerivce.getAuthOptions())
            .catch(this.handleError)
    }

    public put(url: string, object:any, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.put(url, object, this.authSerivce.getAuthOptions())
            .catch(this.handleError)
    }

    public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return this.http.delete(url, this.authSerivce.getAuthOptions())
            .catch(this.handleError)
    }

    public handleError = (error: Response) => {

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