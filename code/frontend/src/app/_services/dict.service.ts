import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Observable }    from 'rxjs';
import { map } from 'rxjs/operators';


import { CodeValue } from '../_models/code';
import { User } from '../_models/user';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';

@Injectable()
export class DictService {

    private workStatuses: CodeValue[];
    private complexities: CodeValue[];
    private roles: CodeValue[];
    private offices: CodeValue[];
    private agreements: CodeValue[];
    private ranks: CodeValue[];
    private initialized: boolean = false;

    constructor(private http: HttpBotWrapper) {
    }

    // call after login!
    public init(): void {
        if (this.initialized === false) {

            console.log("Initializing dictService!");

            this.workStatuses = [];
            this.complexities = [];
            this.roles = [];
            this.offices = [];
            this.agreements = [];
            this.ranks = [];

            this.http.get('/api/v1/codes/WORK_STATUS')
                .subscribe((response:Object) => this.setCodes(response, this.workStatuses));


            this.http.get('/api/v1/codes/COMPLEXITY')
                .subscribe((response:Object) => this.setCodes(response, this.complexities));

            this.http.get('/api/v1/codes/ROLE')
                .subscribe((response:Object) => this.setCodes(response, this.roles));

            this.http.get('/api/v1/codes/OFFICE')
                .subscribe((response:Object) => this.setCodes(response, this.offices))

            this.http.get('/api/v1/codes/RANK')
                .subscribe((response:Object) => this.setCodes(response, this.ranks));

            this.http.get('/api/v1/codes/AGREEMENT_TYPE')
                .subscribe((response:Object) => this.setCodes(response, this.agreements))
        }
        this.initialized = true;

    }

    public getRolesObs(): Observable<CodeValue[]> {
        return  this.http.get('/api/v1/codes/ROLE').pipe(map((response: Object) => this.mapCodeValue(response)));
    }

    public getOfficesObs(): Observable<CodeValue[]> {
        return  this.http.get('/api/v1/codes/OFFICE').pipe(map((response: Object) => this.mapCodeValue(response)));
    }


    private mapCodeValue(response:any):CodeValue[] {
        let result: CodeValue[] = [];
        if (response.list && response.list.length > 0) {
            for (let code of response.list) {
                result.push(code);
            }
        }
        return result;
    }

    // called just after login
    public getRoleObs(keys: string[]): Observable<string[]> {
        return  this.http.get('/api/v1/codes/ROLE').pipe(map((response: Object) => this.getKeys(response, keys)));
    }

    private getKeys(response:any, keys:string[]):string[] {
        let result: string[] = [];
        let codeValues: CodeValue[] = [];
        this.setCodes(response, codeValues);
        for (let key of keys) {
            result.push(this.getValue(key, codeValues));
        }

        return result;
    }

    public getOfficeObs(key: string): Observable<string> {
        return  this.http.get('/api/v1/codes/OFFICE').pipe(map((response: Object) => this.getKey(response, key)));
    }

    private getKey(response:any, key:string):string {
        let codeValues: CodeValue[] = [];
        this.setCodes(response, codeValues);
        return this.getValue(key, codeValues);
    }

    public getRoles(): CodeValue[] {
        return this.roles;
    }

    public getRole(key: string): string {
        return this.getValue(key, this.roles);
    }

    public getOffices(): CodeValue[] {
        return this.offices;
    }

    public getOffice(key: string): string {
        return this.getValue(key, this.offices);
    }

    public getAgreements(): CodeValue[] {
        return this.agreements;
    }

    public getAgreement(key: string): string {
        return this.getValue(key, this.agreements);
    }

    public getRanks(): CodeValue[] {
        return this.ranks;
    }

    public getRank(key: string): string {
        return this.getValue(key, this.ranks);
    }

    public getWorkStatus(key: string): string {
        return this.getValue(key, this.workStatuses);
    }

    public getWorkStatuses(): CodeValue[] {
        return this.workStatuses;
    }

    public getComplexities(): CodeValue[] {
        return this.complexities;
    }

    public getComplexitiy(key: string): string {
        return this.getValue(key, this.complexities);
    }

    // private helper methods

    private getValue(key: string, ref: CodeValue[]): string {
        for(let codeValue of ref) {
            if (codeValue.code === key) {
                return codeValue.paramChar;
                //return key + "=" +codeValue.paramChar;
            }
        }
        return key;
    }


    private setCodes(response:any, ref: CodeValue[]):void {

        if (response.list && response.list.length > 0) {
            for (let code of response.list) {
                ref.push(code);
            }
        }

    }


}