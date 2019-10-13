export class UserTableSummary {

    constructor (){
        this.totalBreakTime = 0;
        this.totalIsLeave = 0;
        
        this.totalActiveUsers = 0;
        this.totalEmployees = 0;
        this.totalUsersFromPool = 0;
        this.totalYOURank = 0;
        this.totalSENRank = 0;
        this.totalREGRank = 0;
        this.totalNONERank = 0;
        this.totalDZIRank = 0;
    }

    totalIsLeave: number;
    totalBreakTime: number;
    totalTimesheetUsedTime: number;
    totalTrainingTimeInGMM: string;
    totalActiveUsers:number;
    totalEmployees:number;
    totalUsersFromPool: number;
    totalYOURank:number;
    totalSENRank:number;
    totalREGRank:number;
    totalNONERank:number;
    totalDZIRank:number;
}