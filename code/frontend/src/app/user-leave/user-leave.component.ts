import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User, Timesheet, SearchUser } from '../_models/index';
import { TimesheetService, ToolsService, AlertService } from '../_services/index';

@Component({
    selector: 'user-leave',
    templateUrl: './user-leave.component.html',
    styleUrls: ['./user-leave.component.css']
})
export class UserLeaveComponent implements OnInit {

    @Input() users:User[];
    suggestedUsers:SearchUser[];
    selectedUser:SearchUser;

    displayEditDialog: boolean = false;

    afterDate:Date;
    beforeDate:Date;


    constructor(private timesheetService:TimesheetService,
                private alertService:AlertService,
                private toolsService: ToolsService) {
    }

    ngOnInit() {
    }

    public showEdit(): void {
        this.displayEditDialog = true;
    }

    suggestUser(event) {
        this.selectedUser = undefined;
        this.suggestedUsers = [];
        if (this.users && this.users.length > 0) {
            for (let user of this.users) {
                let suggestion:string = JSON.stringify(user);
                console.log("suggestUser " + suggestion + " for " + JSON.stringify(event));
                if (suggestion.indexOf(event.query) > -1) {
                    let displayName:string = user.firstName + " " + user.lastName + " (" + user.role + ")";
                    this.suggestedUsers.push(new SearchUser(displayName, user));
                }
            }
        }
        console.log("suggestedUsers " + JSON.stringify(this.suggestedUsers));
    }

    public isFormValid() :boolean {
        return this.selectedUser && this.selectedUser.user && this.selectedUser.user.id > 0 &&
            this.afterDate && this.beforeDate && this.afterDate.getTime()<=this.beforeDate.getTime();
    }

    public confirmLeave(): void {
        console.log("Confirm leave for: "+this.selectedUser.user.id+" test:"+this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd HH:mm:ss')+" "+this.beforeDate.toISOString());

        this.timesheetService.addLeave(
            this.selectedUser.user.id,
            this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd HH:mm:ss'),
            this.toolsService.formatDate(this.beforeDate, 'yyyy-MM-dd HH:mm:ss')
        ).subscribe(result => this.processLeave(result));

        this.displayEditDialog = false;
    }

    private processLeave(result:any):void {
        console.log("Leave response "+JSON.stringify(result))
        if (result && result.created && result.created == 1) {
            this.alertService.info("Zapisano urlop dla "+this.selectedUser.displayName+ " w dniach od "+this.toolsService.formatDate(this.afterDate, 'yyyy-MM-dd') + " do "+this.toolsService.formatDate(this.beforeDate, 'yyyy-MM-dd'));
        } else {
            this.alertService.error("Nie udało się zapisać urlopu dla "+this.selectedUser.displayName);
        }
    }
}