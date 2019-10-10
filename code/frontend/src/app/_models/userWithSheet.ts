import { User, Timesheet } from ".";

export class UserWithSheet extends User {
    rowid: number;

    copy: Timesheet;

    timesheetUsedTime: number; //flat property for p-dataTable used for sort
    timesheetWorkDate: string;
    timesheetFrom: string;
    timesheetTo: string;
    timesheetBreakInMinutes: string;
    timesheetTrainingInGMM: string;
    isLeave: string;

    isManagerOrOperator: string; //Y, N

    color: string;
    status: string;

}