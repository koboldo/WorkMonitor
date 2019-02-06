import { Injectable, Component, OnInit, ViewChild } from '@angular/core';
import { Observable ,  BehaviorSubject }    from 'rxjs';
import { catchError, map, tap, delay, mergeMap } from 'rxjs/operators';


import { Order } from '../_models/order';
import { WorkType } from '../_models/index';
import { DictService } from '../_services/dict.service';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';

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
                .subscribe((response:Object) => this.cacheAndGet(response['list']));

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
            .pipe(map((response: Object) => this.cacheAndGet(response['list'])));
    }

    addWorkType(workType: WorkType): Observable<any> {
        return this.http.post('/api/v1/workTypes', JSON.stringify(workType))
            .pipe(map((response: Object) => response['created']));
    }

    updateWorkType(workType: WorkType): Observable<any> {
        return this.http.put('/api/v1/workTypes/'+workType.id, JSON.stringify(workType))
            .pipe(map((response: Object) => response['updated']));
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


        workTypes.sort(function (a,b) {
            let ap = parseFloat(a.typeCode);
            let ab = parseFloat(b.typeCode);

            if (isNaN(ap) && isNaN(ab)) {
                return ((a.typeCode) >= (b.typeCode)) ? 1 : -1;
            } else if (isNaN(ap)) {
                return 1;
            } else if (isNaN(ab)) {
                return -1;
            } else if ((parseFloat(a.typeCode.split(".")[0]) === parseFloat(b.typeCode.split(".")[0]))) {
                if (parseFloat(a.typeCode.split(".")[1]) >= parseFloat(b.typeCode.split(".")[1])) {
                    return 1;
                } else if (parseFloat(b.typeCode.split(".")[1]) > parseFloat(a.typeCode.split(".")[1])) {
                    return -1;
                }
            } else {
                return ap - ab;
            }
        });
        
        this.cache = workTypes;

        return workTypes;
    }

    public getWorkTypeColorByCode(code: string): string {
        let workType:WorkType = this.getWorkType(code, 'CEN', 'STD');
        if (workType) {
            return workType.color;
        }
        console.log("getWorkTypeColorByCode not inited yet!");
        return 'white';
    }

    public getWorkTypeColor(order: Order): string {
        let workType:WorkType = this.getWorkType(order.typeCode, order.officeCode? order.officeCode : 'CEN', order.complexityCode? order.complexityCode : 'STD');
        if (workType) {
            return workType.color;
        }
        console.log("getWorkTypeColor not inited yet!");
        return null;
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
            .pipe(map((response: Object) => this.processWorkTypes(response['list'])));
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