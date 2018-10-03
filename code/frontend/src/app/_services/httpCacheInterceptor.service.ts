import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import { Observable, AsyncSubject } from "rxjs/Rx";
import { Subject } from 'rxjs/Subject';

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {

    private cache: { [name: string]: AsyncSubject<HttpEvent<any>> } = {};

    private cacheUrlInfinixArr: string[] = ['/api/v1/codes', '/api/v1/persons', '/api/v1/workTypes'];

    private put(cacheUrlInfinix: string, subject: AsyncSubject<HttpEvent<any>>) {
        console.log("Adding to cache "+cacheUrlInfinix);
        this.cache[cacheUrlInfinix] = subject;
        setTimeout(() => {
            this.remove(cacheUrlInfinix);
        }, 600000); //10min
    }

    private removeAll(): void {
        console.log('Cache size '+Object.keys(this.cache).length);
        for(let cacheUrlInfinix of this.cacheUrlInfinixArr) {
            delete this.cache[cacheUrlInfinix];
        }
        console.log('Cache cleaned!');
    }

    private remove(cacheUrlInfinix): void {
        delete this.cache[cacheUrlInfinix];
        console.log('Removed from cache '+cacheUrlInfinix);
    }

    private getCachedInfinix(url: string):string {
        for(let cacheUrlInfinix of this.cacheUrlInfinixArr) {
            if (url.indexOf(cacheUrlInfinix) >= 0) {
                return cacheUrlInfinix;
            }
        }
        return null;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let url: string = request.urlWithParams;
        let cacheKey : string = this.getCachedInfinix(url);

        if (url.indexOf('/login') >= 0) {
            this.removeAll();
        }

        if (request.method !== "GET") {
            if (cacheKey) {
                console.log('Removing '+cacheKey+' from cache due to '+request.method+' on ['+url+']...');
                this.remove(cacheKey);
            }
            return next.handle(request);
        }

        const subject = new AsyncSubject<HttpEvent<any>>();

        if (cacheKey) {
            console.log('Checking cache for '+cacheKey);

            const cachedResponse = this.cache[cacheKey] || null;
            if (cachedResponse) {
                console.log('Cache hit for '+cacheKey+'!');
                return cachedResponse.delay(0);
            } else {
                this.put(cacheKey, subject);
            }
        }

        next.handle(request).do(event => {
            if (event instanceof HttpResponse) {
                subject.next(event);
                subject.complete();
            }
        }).subscribe(); // must subscribe to actually kick off request!
        return subject;

    }
}