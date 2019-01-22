import { Injectable } from '@angular/core';
import { Observable, AsyncSubject, Subject } from "rxjs";
@Injectable({
    providedIn: 'root'
})

export class ProgressService {

    progress: Map<string, number> = new Map<string, number>();
    subject = new Subject<Map<string, number>>();

    constructor() { }

    public getSubject(): Subject<Map<string, number>> {
        return this.subject;
    }

    public cleanProgress(): void {
        this.progress = new Map<string, number>();
        this.subject.next(this.progress);
    }

    public incrementProgress(key: string): void {
        let value: number = this.progress.get(key);
        if (value === undefined) {
            this.progress.set(key, 1);
            console.log("progress service for "+key +"=1 has been added!");
        } else {
            this.progress.set(key, ++value);
            console.log("progress service for "+key +" incremented to "+value);
        }
        this.getSubject().next(this.progress);
    }

    public decrementProgress(key: string): void {
        let value: number = this.progress.get(key);
        if (value !== undefined) {
            if (value === 1) {
                this.progress.delete(key);
                console.log("progress service for "+key +" has been removed!");
            } else {
                this.progress.set(key, --value);
                console.log("progress service for "+key +" decremented to "+value);
            }
        } else {
            console.log("interceptor key="+key +" not found in "+JSON.stringify(this.progress));
        }
        this.getSubject().next(this.progress);
    }


}