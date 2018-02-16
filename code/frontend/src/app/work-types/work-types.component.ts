import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';

@Component({
    selector: 'app-work-types',
    templateUrl: './work-types.component.html',
    styleUrls: ['./work-types.component.css']
})
export class WorkTypesComponent implements OnInit {

    workTypes: WorkType[];
    selectedWorkType: WorkType;
    editedWorkType: WorkType;
    items:MenuItem[] = [];
    displayEditDialog: boolean;
    newWorkType: boolean;


    constructor(private workService:WorkTypeService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private alertService:AlertService,
                private authSerice:AuthenticationService) {
    }


    ngOnInit() {
        this.workService.getAllWorkTypes().subscribe(workTypes => this.workTypes = workTypes);

        this.items = [
            {label: 'Dodaj', icon: 'fa-plus', command: (event) => this.add()},
            {label: 'Zmień', icon: 'fa-pencil-square-o', command: (event) => this.change()}
        ];
    }

    onRowSelect(event) {

    }

    onRowDblclick(event) {
        console.log('onRowDblclick row!' + JSON.stringify(this.selectedWorkType));
        this.change();
    }

    private change():void {
        this.editedWorkType = this.selectedWorkType;
        this.newWorkType = false;
        this.displayEditDialog = true;
    }

    private add():void {
        //this.editedWorkType = JSON.parse(JSON.stringify(this.selectedWorkType));
        this.editedWorkType = new WorkType;
        this.newWorkType = true;
        this.displayEditDialog = true;
    }

    save(): void {
        if (this.newWorkType) {
            this.insert(this.editedWorkType);
        } else {
            this.update(this.editedWorkType);
        }
        this.displayEditDialog = false;

        this.workService.refreshCache().subscribe(workTypes => this.workTypes = workTypes);
    }

    private update(workType: WorkType):void {
        this.workService.updateWorkType(workType)
            .subscribe(result => this.processResult(result));
    }

    private insert(workType: WorkType) {
        this.workService.addWorkType(workType)
            .subscribe(result => this.processResult(result));
    }

    private processResult(result:any):any {
        console.log("Received "+JSON.stringify(result));
    }
}
