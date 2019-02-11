import { User } from '../_models/user';

/*
     WARN data manipulation - trainingTime added to workTime in payroll.service !!!
{
    "personId": 51,
    "periodDate": "2018-01-01",
    "leaveTime": 0,
    "workTime": 28800,
    "poolWorkTime": 28800,
    "overTime": 0,
    "trainingTime" 0

    "leaveDue": 0,
    "workDue": 0,
    "overDue": 0,
    "totalDue": 0,

    "isFromPool": "N",
    "rankCode": "SEN",
    "projectFactor": 1,
    "poolRate": 0.2466,
    "overTimeFactor": 1.5,
    "approved": "N",
    "modifiedBy": 137,
    "lastMod": "2018-03-08 11:19:22"
},
*/

/*export class PayrollHeader {

    periodDate: string;
    overTimeFactor: number;
    approved: string;
    modifiedBy: number;
    lastMod: string;

}*/

export class UserPayroll {

    user: User;

    personId: number;

    leaveTime: number;
    workTime: number;
    poolWorkTime: number;
    nonpoolWorkTime: number;
    overTime: number;
    trainingTime: number;

    leaveDue: number;
    workDue: number;
    overDue: number;
    totalDue: number;

    completedWo: string; //17918|17919|18041|18042|18070|18201|18202|18261|18289

    // user data but could be changed after raport generation
    isFromPool: string;
    rankCode: string;
    rank: string;
    projectFactor: number;
    poolRate: number;
    formattedPoolRate: string;

    //payroll report metadata
    periodDate: string;
    overTimeFactor: number;
    formattedOverTimeFactor: string;
    approved: string;
    lastMod: string;
    modifiedBy: number;
    modifiedByUser: User;

    recalculateButtonStyle: string;

}

/*
export class Payroll {

    header: PayrollHeader;
    userPayrolls: UserPayroll[];

}*/
