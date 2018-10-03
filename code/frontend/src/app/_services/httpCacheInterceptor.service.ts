import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import { Observable, AsyncSubject } from "rxjs/Rx";
import { Subject } from 'rxjs/Subject';

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {

    private cache: { [name: string]: AsyncSubject<HttpEvent<any>> } = {};

    private cacheUrlInfinixArr: string[] = ['/api/v1/codes', '/api/v1/persons', '/api/v1/workTypes'];

    public remove(cacheUrlInfinix): void {
        delete this.cache[cacheUrlInfinix];
        console.log('Removed from cache '+cacheUrlInfinix);
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let url: string = request.urlWithParams;

        if (request.method !== "GET") {
            for(let cacheUrlInfinix of this.cacheUrlInfinixArr) {
                if (url.indexOf(cacheUrlInfinix) >= 0) {
                    console.log('Removing '+cacheUrlInfinix+' from cache due to '+request.method+' ['+url+']...');
                    this.remove(cacheUrlInfinix);
                }
            }
            return next.handle(request);
        }

        for(let cacheUrlInfinix of this.cacheUrlInfinixArr) {
            if (url.indexOf(cacheUrlInfinix) >= 0) {

                console.log('Checking cache for '+url);

                const cachedResponse = this.cache[url] || null;
                if (cachedResponse) {
                    console.log('Cache hit for '+url+'!');
                    return cachedResponse.delay(0);
                }

            }
        }

        const subject = this.cache[url] = new AsyncSubject<HttpEvent<any>>();
        next.handle(request).do(event => {
            if (event instanceof HttpResponse) {
                subject.next(event);
                subject.complete();
            }
        }).subscribe(); // must subscribe to actually kick off request!
        return subject;


    }
}