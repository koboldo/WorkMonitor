export class Timesheet {

    constructor(public personId:number,
                public from:string,
                public to:string) {
    }

    public break: string;       // backend assumes minutes
    public usedTime:number;
    public isLeave: string;
    public createdBy: string;
    public modifiedBy: string;
    public training: string;    // backend assumes minutes eg.120 instead of 2:00

}

