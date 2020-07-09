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
    cols: any;

    complexitySTD: number;
    complexityHRD: number;
    addMode: boolean;
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
        this.cols = [          
            { field: 'id', header: 'Id',hidden:true, sortable: true, filter:true},
            { field: 'color', header: 'Kolor' ,sortable:true,filter:true,  class:"width-20 text-center", icon: true, color:true},
            { field: 'typeCode', header: 'Typ', sortable:true, filter:true, class:"width-50 text-center"},
            { field: 'isFromPool', header: 'Pula',sortable:true , filter:true, class:"width-10 text-center", isFromPool:true, icon:true},
            { field: 'description', header: 'Opis typu' ,filter: true,sortable:true,  class:"width-50", description:true, icon:true},
            { field: 'officeCode', header: 'Biuro',sortable:true, filter:true,class:"width-35 text-center", office:true, icon:true},
            { field: 'complexityCode', header: 'Złożoność', sortable:true, filter:true, class:"width-35 text-center", icon:true, complexityCode:true},
            { field: 'complexity', header: 'Pracochłonność [H]', sortable:true , filter:true, class:"width-35 text-center", complexity:true, icon:true},
            { field: 'price', header: 'Cena [PLN]' , sortable:true, filter:true, class:"width-50 text-center", price:true, icon:true},
            { field: 'isSummable', header: 'Grupowalne w protokołach' , sortable:true, filter:true, class:"width-35 text-center", isSummable:true, icon:true},
          ]
    }

    onRowSelect(event) {

    }

    onRowDblclick(event) {
        console.log('onRowDblclick row!' + JSON.stringify(this.selectedWorkType));
        this.change();
    }

    private change():void {
        this.addMode = false;
        this.editedWorkType = this.selectedWorkType;
        this.newWorkType = false;
        this.displayEditDialog = true;
    }

    private add():void {
        this.addMode = true;
        //this.editedWorkType = JSON.parse(JSON.stringify(this.selectedWorkType));
        this.editedWorkType = new WorkType;
        this.editedWorkType.isFromPool = 'N';
        this.editedWorkType.color = '#000000';
        this.newWorkType = true;
        this.displayEditDialog = true;
        this.editedWorkType.isSummable = 'Y';
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

    private async insert(workType: WorkType) {
        workType.complexityCode="STD";
        workType.complexity = this.complexitySTD;
        this.processResult(await this.workService.addWorkType(workType).toPromise());
        workType.complexityCode ="HRD";
        workType.complexity = this.complexityHRD;
        this.processResult(await this.workService.addWorkType(workType).toPromise());
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
