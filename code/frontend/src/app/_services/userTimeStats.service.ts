
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';

import { User, Order, Timestats } from '../_models/index';
import { HttpBotWrapper } from '../_services/httpBotWrapper.service';
import { DictService } from '../_services/dict.service';
import { Observable }    from 'rxjs';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';




@Injectable()
export class UserTimeStatsService {

    constructor(private http: HttpBotWrapper, private dictService: DictService) {
        console.log('UserTimeStatsService created');
    }

    //  /api/v1/report/personTimestats?periodDate=2018-03-03&personId=87,88,89

    getByDateAndUserIds(users: User[], date: string, ids: number[]) : Observable<Timestats[]> {
        let personIds: string = '';
        for (let id of ids) {
            personIds += ''+id+',';
        }
        personIds = personIds.substr(0, personIds.length-1);

        return this.http.get('/api/v1/report/personTimestats?periodDate='+date+'&personId='+personIds).pipe(
            map((response: Object) => this.getTimestats(response, users)))
    }

    private getTimestats(response:any, users: User[]):any {
        let timestats: Timestats[] = [];

        if (response.list && response.list.length > 0) {
            for (let timestat of response.list) {
                this.fillUser(timestat, users);
                timestats.push(timestat);
            }
        }

        console.log('Got and filled '+JSON.stringify(timestats));
        return timestats;
    }

    private fillUser(timestat:Timestats, users:User[]):void {
        for(let user of users) {
            if (user.id === timestat.personId) {
                timestat.user = user;
                return;
            }
        }

    }
}