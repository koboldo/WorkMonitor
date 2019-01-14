import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe }         from '@angular/common';
import { Observable }       from 'rxjs';



import { AlertService } from '../_services/alert.service';
import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { SelectItem } from 'primeng/primeng'


@Injectable()
export class ToolsService {

    datePipe :DatePipe = new DatePipe('en-US');

    public NO_WO = 'XXXXX';
    public NO_CAPEX = 'YYYYY';

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

    public formatDate(date: Date, format: string): string {
        return this.datePipe.transform(date, format, 'pl-PL');
    }

    public parsePrice(price:string, workNo: string):number {
        console.log('parsing price ' + price);
        if (price === undefined || price === '' || price === '\'\'' || price === '{}') {
            this.alertService.warn('Nie ustawiono ceny dla zlecenia '+workNo+'...');
            return undefined;
        }

        try {
            // dot not allowed! let resultPrice = +price.replace(/\D/g, '');
            let resultPrice: string = price.replace (/[^\d\.]/g, '');
            //limit number of dots:
            let dot: string[] = resultPrice.split('.');
            if (dot.length > 2) {
                resultPrice = dot[0]+'.'+dot[1];
            }
            resultPrice = parseFloat(resultPrice).toFixed(2);
            console.log('parsing price: '+price+ ' after '+resultPrice);
            return +resultPrice;
        } catch (e) {
            this.alertService.warn('Nie ustawiono ceny dla zlecenia '+workNo+'...');
            return undefined;
        }
    }

    public getOrderColor(typeCode :string) :string {

        if (typeCode === undefined || typeCode === null)
            return 'black';
        else if (typeCode === 'OT')
            return 'grey';
        else if (typeCode === 'IN')
            return 'darkgrey';
        else if (typeCode.startsWith('0.'))
            return '#d1e0e0';
        else if (typeCode.startsWith('1.'))
            return '#ffffaa';
        else if (typeCode.startsWith('2.'))
            return 'yellow';
        else if (typeCode.startsWith('3.'))
            return 'orange';
        else if (typeCode.startsWith('4.'))
            return '#b3ffff';
        else if (typeCode.startsWith('5.'))
            return '#66a3ff';
        else if (typeCode.startsWith('6.'))
            return '#00cccc';
        else if (typeCode.startsWith('7.'))
            return '#0066ff';
        else if (typeCode.startsWith('8.'))
            return '#ffccff';
        else if (typeCode.startsWith('9.'))
            return '#d9b3ff';
        else if (typeCode.startsWith('10.'))
            return '#800080';
        else if (typeCode.startsWith('11.'))
            return '#88cc00';
        else if (typeCode.startsWith('12.'))
            return '#cc0088';
        else if (typeCode.startsWith('13.'))
            return 'red';

        //console.log('Return default color for '+typeCode+'!');

        return 'black';

    }

    /*
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','OP','Otwarte');
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','AS','Przypisane');
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','CO','Zakończone');
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','IS','Wydane');
     -- removed INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','AC','Zaakceptowane');
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','CL','Zamknięte');
     INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','SU','Zawieszone');
     -- added INSERT INTO CODE_REFERENCE (CODE_TABLE, CODE, PARAM_CHARVAL) VALUES ('WORK_STATUS','CA','Anulowane');
     */

    public getStatusIcon(statusCode: string) {
        if (statusCode === 'OP')
            return 'fa fa-keyboard-o';
        else if (statusCode === 'AS')
            return 'fa fa-user';
        else if (statusCode === 'CO')
            return 'fa fa-child';
        else if (statusCode === 'IS')
            return 'fa fa-paperclip';
        else if (statusCode === 'AC')
            return 'fa fa-envelope-open-o';
        /*else if (statusCode === 'CL')
            return 'fa fa-battery-4';*/
        else if (statusCode === 'CL')
            return 'fa fa-envelope-o';
        else if (statusCode === 'SU')
            return 'fa fa-ban';
        else if (statusCode === 'CA')
            return 'fa fa-trash-o';

        console.log('Return default status icon for '+statusCode+'!');
        return 'fa question';
    }

    public isStatusAllowed(order: Order, statusCode: string): boolean {
        if (statusCode === 'IS' && this.isReadyForProtocol(order,false)) {
            return true;
        } else if (order.assignee && order.assignee.length > 0) {
            return true;
        } else if (statusCode === 'OP' || statusCode === 'CA' || statusCode === 'SU') {
            return true;
        }
        return false;
    }

    public isStatusLowerThanProtocol(statusCode: string): boolean{
        return statusCode === 'OP' || statusCode === 'AS' || statusCode === 'CO' || statusCode === 'IS' || statusCode === 'AC';
    }


    private logReason(order:Order){
        let reason: string [] = [];
        if(order.officeCode!='KAT'&& order.workNo===this.NO_WO){
            reason.push(' Brak numeru zlecenia ');
        }
        if (order.officeCode==='KAT'&& order.mdCapex===this.NO_CAPEX){
            reason.push(' Brak numeru CAPEX ');
        }
        if (order.officeCode==='KAT'&& order.workNo===this.NO_WO){
            reason.push(' Brak numeru zlecenia ');
        }
        if (!order.assignee){
            reason.push(' Brak przypisanego wykonawcy ');
        }
        if (order.itemId===undefined){
            reason.push(' Brak przypisanego obiektu ');
        }
        if (order.typeCode!='OT'&& order.price===undefined){
            reason.push(' Brak ceny zlecenia ');
        }
        if (order.typeCode!='OT'&& order.price===0){
            reason.push(' Brak ceny zlecenia ');
        }
        
        return reason.toString();
    }
    public isReadyForProtocol(order:Order, isForProtocol:boolean):boolean {
       if (isForProtocol)
       {  
           if  (order.typeCode === 'OT'){
               if (order.officeCode==='KAT'){
                   if(order.workNo != this.NO_WO && order.assignee && order.itemId != undefined && order.mdCapex !== this.NO_CAPEX)
                   return true;
               }
               else if (order.workNo != this.NO_WO && order.assignee && order.itemId != undefined){
                   return true;
               }
               else {
                    order.frontProcessingDesc=this.logReason(order);
                    return false;
               }             
           }
           else if (order.officeCode==='KAT'){
                if (order.workNo != this.NO_WO && order.assignee && order.itemId != undefined && order.mdCapex !== this.NO_CAPEX && order.price!=undefined && order.price!=0){
                    return true;
                 }
                 else {
                     order.frontProcessingDesc=this.logReason(order);
                     return false;
                 }  
                }             
           else {
               if (order.workNo != this.NO_WO && order.assignee && order.itemId != undefined && order.price!=undefined && order.price!=0) {
                   return true;
               }
            else {
                order.frontProcessingDesc=this.logReason(order);
                return false;
            }
           } 
        }
        if (order.officeCode === 'KAT') {
            return order.workNo != this.NO_WO && order.assignee && order.itemId != undefined && order.mdCapex !== this.NO_CAPEX;
        }
        return order.workNo != this.NO_WO && order.assignee && order.itemId != undefined;
    }


    public downloadXLSFile(fileName: string, contentBase64: string) {

        console.log('download ' + fileName);

        var byteCharacters = atob(contentBase64);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);

        let blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        let e = document.createEvent('MouseEvents');
        let a = document.createElement('a');

        a.download = fileName;
        a.href = window.URL.createObjectURL(blob);


        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    public mapToSelectItem(pairs:CodeValue[], ref:SelectItem[]):boolean {
        for (let pair of pairs) {
            ref.push({label: pair.paramChar, value: pair.code});
        }
        return true;
    }

    public convertGMMToMinutes(gMM: string): string {
        let hours: number = parseInt(gMM.substr(0,1), 10);
        var minutes: number = parseInt(gMM.substr(2,2), 10);
        return ''+((hours*60) + minutes);
    }

    public convertHoursDecimalToMinutes(input: string, additive: number): string {
        let inputDecimal : number = parseFloat(input)+additive; //FIXME trick to enable comparing - this is floored somewhere on backend
        return ''+(inputDecimal*60);
    }

    public convertMinutesToGMM(input: string): string {
        let minNum: number = parseInt(input, 10);
        let hours: number = Math.floor(minNum / 60);
        let minutes: number = minNum - (hours * 60);
        let minutesPadded: string = minutes < 10 ? '0'+minutes : ''+minutes;
        return ''+hours+':'+minutesPadded;
    }

    public censorUser(key, value) {
        if (key === 'modifiedByUser') {
            return undefined;
        }
        return value;
    }


}