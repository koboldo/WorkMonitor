import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';


import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { MenuItem } from 'primeng/primeng';
import { SelectItem } from 'primeng/primeng'

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

    showOffices: boolean;
    offices:SelectItem[] = [];

    showComplexities: boolean;
    complexities:SelectItem[] = [];

    constructor(private workService:WorkTypeService,
                private dictService:DictService,
                private toolsService:ToolsService,
                private alertService:AlertService,
                private authSerice:AuthenticationService) {
    }


    ngOnInit() {
        this.workService.getAllWorkTypes().subscribe(workTypes => this.workTypes = workTypes);
        this.dictService.getOfficesObs().subscribe((offices:CodeValue[]) => this.mapToOffices(offices));
        this.mapToComplexities(this.dictService.getComplexities());

        this.items = [
            {label: 'Dodaj', icon: 'fa fa-plus', command: (event) => this.add()},
            {label: 'Zmień', icon: 'fa fa-pencil-square-o', command: (event) => this.change()}
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
        this.editedWorkType.isFromPool = 'N';
        this.editedWorkType.color = '#000000';
        this.newWorkType = true;
        this.displayEditDialog = true;
    }

    save(): void {
        if (this.newWorkType) {
            if (this.editedWorkType.officeCode === 'ALL') {
                for(let office of this.offices) {
                    if (office.value !== 'ALL') {
                        this.editedWorkType.officeCode = office.value;
                        this.insert(this.editedWorkType);
                    }
                }
            } else {
                this.insert(this.editedWorkType);
            }
        } else {
            this.update(this.editedWorkType);
        }
        this.displayEditDialog = false;
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
        this.workService.refreshCache().subscribe(workTypes => this.workTypes = workTypes);
    }

    private mapToOffices(pairs:CodeValue[]):void {
        let all: CodeValue = new CodeValue('ALL', 'WSZYSTKIE');
        pairs.unshift(all);
        this.showOffices = this.toolsService.mapToSelectItem(pairs, this.offices);
    }

    private mapToComplexities(pairs:CodeValue[]):void {
        this.showComplexities = this.toolsService.mapToSelectItem(pairs, this.complexities);
    }
}
