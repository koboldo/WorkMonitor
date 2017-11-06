import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { CodeValue } from '../_models/code';
import { User } from '../_models/user';
import { AuthenticationService } from '../_services/authentication.service';

@Injectable()
export class DictService {

    private workStatuses: CodeValue[];
    private workTypes: CodeValue[];
    private complexities: CodeValue[];


    constructor(private http: Http, private authService: AuthenticationService) {
    }

    // call after login!
    public init(): void {
        this.workStatuses = [];
        this.workTypes = [];
        this.complexities = [];

        this.http.get('/api/v1/codes/WORK_STATUS', this.authService.getAuthOptions())
            .subscribe((response: Response) => this.setCodes(response.json(), this.workStatuses));

        this.http.get('/api/v1/codes/WORK_TYPE', this.authService.getAuthOptions())
            .subscribe((response: Response) => this.setCodes(response.json(), this.workTypes));

        this.http.get('/api/v1/codes/COMPLEXITY', this.authService.getAuthOptions())
            .subscribe((response: Response) => this.setCodes(response.json(), this.complexities));

    }

    public getRolesObs(): Observable<CodeValue[]> {
        return  this.http.get('/api/v1/codes/ROLE', this.authService.getAuthOptions()).map((response: Response) => this.mapRoles(response.json()))
    }

    public getOfficesObs(): Observable<CodeValue[]> {
        return  this.http.get('/api/v1/codes/OFFICE', this.authService.getAuthOptions()).map((response: Response) => this.mapRoles(response.json()))
    }


    private mapRoles(response:any):CodeValue[] {
        let result: CodeValue[] = [];
        if (response.list && response.list.length > 0) {
            for (let code of response.list) {
                result.push(code);
            }
        }
        return result;
    }

    // called just after login
    public getRoleObs(key: string): Observable<string> {
        return  this.http.get('/api/v1/codes/ROLE', this.authService.getAuthOptions()).map((response: Response) => this.mapRole(response.json(), key))
    }

    private mapRole(response:any, key:string):string {
        let roles: CodeValue[] = [];
        this.setCodes(response, roles);
        return this.getValue(key, roles);
    }


    public getWorkStatus(key: string): string {
        return this.getValue(key, this.workStatuses);
    }

    public getWorkType(key: string): string {
        return this.getValue(key, this.workTypes);
    }

    public getComplexities(key: string): string {
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