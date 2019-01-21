import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders} from '@angular/common/http';
import { Observable, AsyncSubject, Subject } from "rxjs";
import { catchError, map, tap, delay } from 'rxjs/operators';
import { AlertService } from '../_services/alert.service';
import { AuthenticationService } from '../_services/authentication.service';
import { VersionService } from '../_services/version.service';
import { Router } from '@angular/router';
import { Md5 } from 'ts-md5/dist/md5';

@Injectable()
export class HttpHeadersInterceptor implements HttpInterceptor {

    constructor(private alertService: AlertService,
                private authSerivce: AuthenticationService,
                private versionService: VersionService) {
    }



    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let headers: HttpHeaders = this.authSerivce.getHttpHeaders();

        if (headers) {
            headers = headers.set('Front-Version', this.versionService.version)
        }

        const authReq = req.clone({
            headers: headers
        });

        console.log('Auth request with httpHeaders');

        return next.handle(authReq);

    }
}