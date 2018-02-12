export class Timesheet {

    constructor(public personId:number,
                public from:string,
                public to:string) {
    }

    public break: string;
    public usedTime:number;
    public isLeave: string;
    public createdBy: string;
    public modifiedBy: string;

}

