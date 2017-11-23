export class Timesheet {

    constructor(public personId:number,
                public workDate:string,
                public usedTime:number) {
    }

    public from: number;
    public to: number;
    public breakInMinutes: number;
}

