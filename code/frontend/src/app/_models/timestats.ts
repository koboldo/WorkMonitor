import { User } from '../_models/user';

export class Timestats {

    /*
     "personId": 88,
     "periodBeginning": "2018-03-01",
     "periodEnd": "2018-03-31",
     "leaveTime": 40,
     "workTime": 138.58,
     "trainingTime": 0,
     "poolWorkTime": 138.58,
     "nonpoolWorkTime": 0,
     "overTime": 0,
     "isFromPool": "Y"
     */

    constructor(public personId:number,
                public periodBeginning:string,
                public periodEnd:string) {
    }

    public leaveTime: number;
    public workTime:number;
    public trainingTime: number;
    public poolWorkTime: number;
    public nonpoolWorkTime: number;
    public overTime: number;
    public isFromPool: string;

    //filled by UI
    public user: User;
}

