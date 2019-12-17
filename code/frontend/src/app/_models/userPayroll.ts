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

    completedWo: string; //id:price:?:factor:?:?:isFromPool -> 17712:2000::1.0:::Y|17922:820::1.0:::Y|17923:100::1.0:::Y|17957:820::1.0:::Y|17958:100::1.0:::Y|17970:410::1.0:::Y|17991:410::1.0:::Y|18160:100::1.0:::Y|18161:360::1.0:::Y|18165:50::1.0:::Y|18184:850::1.0:::Y|18196:410::1.0:::Y|18197:150::1.0:::Y|18249:100::1.0:::Y,

    // user data but could be changed after raport generation
    isFromPool: string;
    rankCode: string;
    rank: string;
    projectFactor: number;
    poolRate: number;
    formattedPoolRate: string;

    //payroll report metadata
    periodDate: string;
    formattedPeriodDate: string;

    overTimeFactor: number;
    formattedOverTimeFactor: string;
    approved: string;
    lastMod: string;
    modifiedBy: number;
    modifiedByUser: User;

    recalculateButtonStyle: string;

    // the temporary field only for the purposes of historical reports after the changes in the api payments will be removed
    budget: any;

}

/*
export class Payroll {

    header: PayrollHeader;
    userPayrolls: UserPayroll[];

}*/
