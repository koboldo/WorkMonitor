import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable }    from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import 'rxjs/add/operator/map';

import { Order } from '../_models/order';
import { WorkType } from '../_models/index';
import { DictService } from '../_services/dict.service';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';
import 'rxjs/add/operator/mergeMap';
import { CodeValue } from '../_models/code';

@Injectable()
export class WorkTypeService {

    private cache: WorkType[];
    private initialized: boolean;

    constructor(private http: HttpBotWrapper) {
        console.log("RelatedItemService options");
    }

    public init(): void {
        if (this.initialized === false) {

            console.log("Initializing workTypeService!");
            this.http.get('/api/v1/workTypes')
                .subscribe((response:Response) => this.cacheAndGet(response['list']));

        }
        this.initialized = true;

    }

    getAllWorkTypes() : Observable<WorkType[]> {
        return this.getAllWorkTypesInternal(false);
    }

    refreshCache(): Observable<WorkType[]> {
        console.log("Refreshing WorkType cache...");
        return this.getAllWorkTypesInternal(true);
    }

    private getAllWorkTypesInternal(refreshCache: boolean) : Observable<WorkType[]> {
       return this.http.get('/api/v1/workTypes')
            .map((response: Response) => this.cacheAndGet(response['list']));
    }

    addWorkType(workType: WorkType): Observable<any> {
        return this.http.post('/api/v1/workTypes', JSON.stringify(workType))
            .map((response: Response) => response['created']);
    }

    updateWorkType(workType: WorkType): Observable<any> {
        return this.http.put('/api/v1/workTypes/'+workType.id, JSON.stringify(workType))
            .map((response: Response) => response['updated']);
    }

    /*
        requires cache!
     */
    getWorkType(typeCode: string, officeCode: string, complexityCode: string): WorkType {
        if (this.cache) {
            for(let workType of this.cache) {
                if (workType.typeCode === typeCode && workType.officeCode === officeCode && workType.complexityCode === complexityCode) {
                    return workType;
                }
            }
        }
        return null;
    }

    private cacheAndGet(workTypes: WorkType[]): WorkType[] {
        console.log("Caching workTypes! first: "+JSON.stringify(workTypes[0]));

        this.cache = workTypes;

        return workTypes;
    }

    public getWorkTypeDescription(order: Order): string {
        let workType:WorkType = this.getWorkType(order.typeCode, order.officeCode? order.officeCode : 'CEN', 'STD');
        if (workType) {
            return workType.description;
        }
        console.log("getWorkTypeDescription not inited yet!");
        return null;
    }

    public getWorkTypes(): Observable<CodeValue[]> {
        if (this.cache) {
            return new BehaviorSubject<CodeValue[]>(this.processWorkTypes(null)).asObservable();
        }
        return this.http.get('/api/v1/workTypes')
            .map((response: Response) => this.processWorkTypes(response['list']));
    }

    private processWorkTypes(workTypes: WorkType[]): CodeValue[] {
        let cache: WorkType[] = workTypes ? this.cacheAndGet(workTypes): this.cache;
        let map: Map<string, string> = new Map<string, string>();
        let result: CodeValue[] = [];

        for(let workType of cache) {
            map.set(workType.typeCode, workType.description);
        }

        map.forEach((value: string, key: string) => {
            result.push(new CodeValue(key, value));
        });

        return result;
        

    }

}