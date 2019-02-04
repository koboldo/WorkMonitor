import { Component, OnInit } from '@angular/core';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';
import { WoComponent } from 'app/wo/wo.component';

@Component({
  selector: 'app-wo-turbo-table',
  templateUrl: './wo-turbo-table.component.html',
  styleUrls: ['./wo-turbo-table.component.css']
})
export class WoTurboTableComponent extends WoComponent  {

   cols:any[] ;
   
   constructor( protected woService:WOService,
                protected userService:UserService,
                protected itemService:RelatedItemService,
                protected workTypeService:WorkTypeService,
                protected dictService:DictService,
                protected alertService:AlertService,
                protected authSerice:AuthenticationService,
                protected toolsService: ToolsService) {
                super(woService,userService,itemService,workTypeService,dictService,alertService,authSerice,toolsService);      
   }

   ngOnInit() {
       this.userService.getEngineersAndContractors().subscribe(engineers => this.engineers = engineers);
       this.userService.getVentureRepresentatives().subscribe(ventureRepresentatives => this.ventureRepresentatives = ventureRepresentatives);
       this.itemService.getAllItems().subscribe(relatedItems => this.relatedItems = relatedItems);
       this.workTypeService.getAllWorkTypes().subscribe(workTypesDetails => this.workTypesDetails = workTypesDetails);
       this.authSerice.userAsObs.subscribe(user => this.assignOperator(user));

       this.workTypeService.getWorkTypes().subscribe(workTypes => this.workTypes = workTypes);
       this.statuses = this.dictService.getWorkStatuses();
      
       this.search();
       this.cols = [
           { field: 'officeCode', header: 'Biuro' , sortable: true, filter:true,class:"text-center-55"},
           { field: 'id', header: 'id', hidden: true, sortable: true, filter:true},
           { field: 'workNo', header: 'Zlecenie', sortable: true, filter:true, class:"width-100"},
           { field: 'status', header: 'Status' , filter:true,statusCode:true, class:"width-135"},
           { field: 'type', header: 'Typ', sortable:true, filter:true, type:true, class:"width-135"},
           { field: 'complexityCode', header: 'Zł.', sortable:true, filter:false,complexity:true, icon:true,class:"text-center" },
           { field: 'complexity', header: 'Wycena' , sortable:true, filter:false,class:"text-center-55"},
           { field: 'mdCapex', header: 'CAPEX', sortable:true, filter:true,class:"width-100" },
           { field: 'price', header: 'Cena', sortable:true, filter:true,class:"width-70 text-right" },
           { field: 'sComments', header: 'Komentarz', hidden:true, sortable:true , filter:true},
           { field: 'description', header: 'Opis', hidden:true, filter:true },
           { field: 'assignee', header: 'Wykonawca', sortable:true, filter:true, class:"width-100" },
           { field: 'isFromPool', header: 'Pula' , sortable:true, filter:true, isFromPool:true, icon:true, class:"text-center"},
           { field: 'protocolNo', header: 'Protokół', sortable:true, filter:true, class:"width-100" },
           { field: 'lastModDate', header: 'Mod.' , sortable:true, filter:true, class:"width-100"},
           { field: 'creationDate', header: 'Utw.', sortable:true , filter:true, class:"width-100"},
           { field: 'itemNo', header: 'Numer obiektu' , sortable:true, filter:true, class:"width-125"},
           { field: 'itemBuildingType', header: 'Typ obiektu', hidden:true, sortable:true, filter:true },
           { field: 'itemConstructionCategory', header: 'Konstrukcja', hidden:true, sortable:true, filter:true },
           { field: 'itemAddress', header: 'Adres', hidden:true, sortable:true, filter:true },
           { field: 'itemDescription', header: 'Opis obiektu', hidden:true, sortable:true , filter:true},
           { field: 'ventureCompany', header: 'Inwestor', sortable:true , filter:true, class:"width-135"},
           { field: 'ventureDisplay', header: 'Zleceniodawca', sortable:true , filter:true, class:"width-135" },
           { button: true, icone:true, class:"width-35"}          
       ];     
   }
}
