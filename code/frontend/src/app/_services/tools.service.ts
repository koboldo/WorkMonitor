import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { AlertService } from '../_services/alert.service';
import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class ToolsService {

    constructor(private alertService: AlertService) {

    }

    public getEngineers(emails:string[], engineers: User[]):User[] {
        return engineers.filter(engineer => this.filterEnginner(engineer, emails));
    }

    private filterEnginner(engineer:User, emails:String[]):boolean {
        if (emails === undefined || emails.length < 1) {
            return false;
        }
        return emails.indexOf(engineer.email) > -1;
    }

    public getCurrentDateDayOperation(day:number):Date {
        return this.getDateDayOperation(day, new Date());
    }

    public getDateDayOperation(day:number, date: Date):Date {
        date.setDate(date.getDate() + day);
        return date;
    }

    public findSelectedOrderIndex(order:Order, orders:Order[]):number {
        let index:number = 0;
        for (let tabOrder of orders) {
            if (order.id === tabOrder.id) {
                return index;
            }
            index++;
        }
        return -1;
    }

    /*YYYY-MM-DD hh:mm:ss*/
    public parseDate(dateAsString: string): Date {
        let d: Date =  new Date(dateAsString.replace(/-/g, '/'));
        d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
        return d;

    }

    public parsePrice(price:string, workNo: string):number {
        console.log("parsing price " + price);
        if (price === undefined || price === "" || price === "\"\"" || price === "{}") {
            this.alertService.warn("Nie ustawiono ceny dla zlecenia "+workNo+"...");
            return undefined;
        }

        try {
            return +price.replace(/\D/g, '');
        } catch (e) {
            this.alertService.warn("Nie ustawiono ceny dla zlecenia "+workNo+"...");
            return undefined;
        }
    }

    // private helper methods

}