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

    public getWorkStatuses(): CodeValue[] {
        return this.workStatuses;
    }

    public getWorkStatus(key: string): string {
        for(let codeValue of this.workStatuses) {
            if (codeValue.code === key) {
                return codeValue.paramChar;
                //return key + "=" +codeValue.paramChar;
            }
        }
        return key;
    }

    constructor(private http: Http, private authService: AuthenticationService) {
        this.http.get('/api/v1/codes/WORK_STATUS', this.authService.getAuthOptions())
            .subscribe((response: Response) => this.setCodes(response.json()));
    }


    // private helper methods

    private setCodes(response:any):void {
        this.workStatuses = [];

        if (response.list && response.list.length > 0) {
            for (let code of response.list) {
                this.workStatuses.push(code);
            }
        }

    }
}