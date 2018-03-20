import { User } from '../_models/user';

/*
{
    "personId": 51,
    "periodDate": "2018-01-01",
    "leaveTime": 0,
    "workTime": 28800,
    "poolWorkTime": 28800,
    "overTime": 0,

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

    leaveDue: number;
    workDue: number;
    overDue: number;
    totalDue: number;

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

}

/*
export class Payroll {

    header: PayrollHeader;
    userPayrolls: UserPayroll[];

}*/
