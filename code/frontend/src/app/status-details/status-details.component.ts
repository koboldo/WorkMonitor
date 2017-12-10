import { Component, OnInit } from '@angular/core';

import { User, RelatedItem, Order, WorkType, CodeValue } from '../_models/index';
import { WOService, RelatedItemService, UserService, DictService, AlertService, WorkTypeService, AuthenticationService, ToolsService } from '../_services/index';


@Component({
  selector: 'app-status-details',
  templateUrl: './status-details.component.html',
  styleUrls: ['./status-details.component.css']
})
export class StatusDetailsComponent implements OnInit {

  constructor(private toolsService: ToolsService, public dictService: DictService) { }

  ngOnInit() {
  }

  public getStatusIcon(statusCode: string): string {
    return this.toolsService.getStatusIcon(statusCode);
  }

}
