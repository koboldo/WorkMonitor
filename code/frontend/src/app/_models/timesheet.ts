export class Timesheet {

    constructor(public personId:number,
                public workDate:string,
                public usedTime:number) {
    }

    public from: string;
    public to: string;
    public breakInMinutes: number;
}

