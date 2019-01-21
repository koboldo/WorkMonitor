import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import { Observable, AsyncSubject, Subject } from "rxjs";
import { catchError, map, tap, delay } from 'rxjs/operators';
import { AlertService } from '../_services/alert.service';
import { ProgressService } from '../_services/progress.service';
import { Router } from '@angular/router';

@Injectable()
export class HttpProgressInterceptor implements HttpInterceptor {

    constructor(private alertService: AlertService, private router: Router, private progressService: ProgressService) {}

    private getProgressKey(url: string):string {
        return url;
    }


    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let urlKey: string = this.getProgressKey(req.url);

        if (urlKey.indexOf('/login') >= 0) {
            this.progressService.cleanProgress();
        }

        this.progressService.incrementProgress(urlKey);

        return next.handle(req).pipe(tap(
            (event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    this.progressService.decrementProgress(urlKey);
                }
            },
            (errBody: any) => {

                this.progressService.decrementProgress(urlKey);
                console.log("This is an error: "+JSON.stringify(errBody));

                if(errBody.status === 403) { //forbidden
                    if (errBody !== undefined && errBody.message === "jwt expired") {
                        this.alertService.error("Sesja wygasła");
                    } else {
                        this.alertService.error("Zostałeś wylogowany z powodu próby nieautoryzowanego dostępu do zasobu!");
                    }
                    this.router.navigate(['logme']); //navigate home
                } else {
                    this.alertService.error("Wewnętrzny bląd zasobu: ("+errBody['statusText']+'), '+ (errBody !== undefined && errBody.url ? errBody.url : "?"));
                }

            }
        ));

    }
}