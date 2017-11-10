import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';



import { Order } from '../_models/order';
import { WOService } from '../_services/wo.service';
import { UserService } from '../_services/user.service';
import { DictService } from '../_services/dict.service';
import { MenuItem } from 'primeng/primeng';
import { User } from '../_models/index';
import { CodeValue } from '../_models/code';

@Component({
  selector: 'app-wo',
  templateUrl: './wo.component.html',
  styleUrls: ['./wo.component.css']
})
export class WoComponent implements OnInit {

  /* search and selection */
  lastModAfter: Date;
  lastModBefore: Date;
  orders: Order[];
  selectedOrder: Order;

  /* edit */
  editedOrder: Order;
  newOrder: boolean;
  isNewOrderOwner: boolean
  displayEditDialog: boolean;
  displayAssignDialog: boolean;
  displayWrongStateForAssingmentDialog: boolean
  items: MenuItem[];


  /* autocompletion assignedEngineer */
  engineers: User[] = [];
  suggestedEngineers: SearchEnginner[];
  assignedEngineer: SearchEnginner;

  /* autocompletion workType */
  workTypes: CodeValue[] = [];
  suggestedTypes: CodeValue[];
  workType: CodeValue;

  /* autocompletion statuses */
  statuses: CodeValue[] = [];
  suggestedStatuses: CodeValue[];
  status: CodeValue;

  constructor(private woService: WOService, private userService: UserService, private dictService: DictService) {
    this.lastModAfter = this.getCurrentDateDayOperation(-61);
    this.lastModBefore = this.getCurrentDateDayOperation(1);
    this.items = [
      {label: 'Przypisz wykonawce', icon: 'fa-user', command: (event) => this.assign(true)},
      {label: 'Dopisz wykonawce', icon: 'fa-share', command: (event) => this.assign(false)},
      {label: 'Edycja zlecenia', icon: 'fa-pencil-square-o', command: (event) => this.edit()},
      {label: 'Dodaj nowe zlecenie', icon: 'fa-plus', command: (event) => this.add()}
    ];
  }

  ngOnInit() {
    this.search();
    this.userService.getEngineers().subscribe(engineers => this.engineers = engineers);

    this.workTypes = this.dictService.getWorkTypes();
    this.statuses = this.dictService.getWorkStatuses();
  }

  search() {
    this.woService.getOrdersByDates(
        this.lastModAfter.toISOString().substring(0, 10),
        this.lastModBefore.toISOString().substring(0, 10)
    ).subscribe(orders => this.orders = orders);
  }

  suggestStatus(event) {
    this.suggestedStatuses = [];
    if (this.statuses && this.statuses.length > 0) {
      for(let status of this.statuses) {
        if(status.paramChar.indexOf(event.query) > -1) {
          this.suggestedStatuses.push(status);
        }
      }
    }
    console.log("suggestedStatuses: "+JSON.stringify(this.suggestedStatuses));
  }

  suggestType(event) {
    this.suggestedTypes = [];
    if (this.workTypes && this.workTypes.length > 0) {
      for(let workType of this.workTypes) {
        if(workType.paramChar.indexOf(event.query) > -1) {
          this.suggestedTypes.push(workType);
        }
      }
    }
    console.log("suggestedTypes: "+JSON.stringify(this.suggestedTypes));
  }

  suggestEngineer(event) {
    this.suggestedEngineers = [];
    if (this.engineers && this.engineers.length > 0) {
      for(let engineer of this.engineers) {
        let suggestion: string = JSON.stringify(engineer);
        if(suggestion.indexOf(event.query) > -1) {
          let displayName: string = engineer.firstName +" "+engineer.lastName+" ("+engineer.role+")";
          this.suggestedEngineers.push(new SearchEnginner(displayName, engineer));
        }
      }
    }
    console.log("suggestedEngineers "+JSON.stringify(this.suggestedEngineers));
  }

  onRowSelect(event) {
    console.log("selected row!" + JSON.stringify(this.selectedOrder));
    //this.activites = this.processService.fetchProcess(this.selectedProcess);
  }

  assign(isNewOrderOwner: boolean): void {
    console.log("assigning!" + JSON.stringify(this.selectedOrder));
    if (isNewOrderOwner && this.selectedOrder.statusCode === "CO") {
      this.displayWrongStateForAssingmentDialog = true;
    } else {
      this.isNewOrderOwner = isNewOrderOwner;
      this.newOrder = false;
      this.editedOrder = this.selectedOrder;
      this.displayAssignDialog = true;
    }
  }

  closeWrongStateForAssignment() {
    this.displayWrongStateForAssingmentDialog = false;
  }

  add() {
    this.editedOrder = new Order(null, "OP", this.dictService.getWorkStatus("OP"), null, null, "STD", this.dictService.getComplexities("STD"), null, null, null, null, null, null, null);
    this.status = new CodeValue(this.editedOrder.statusCode, this.editedOrder.status);
    this.newOrder = true;
    this.displayEditDialog = true;
  }

  edit(): void {

    console.log("editing!" + JSON.stringify(this.selectedOrder));
    //initial values based on selectedOrder for form
    this.workType = new CodeValue(this.selectedOrder.typeCode, this.selectedOrder.type);
    this.status = new CodeValue(this.selectedOrder.statusCode, this.selectedOrder.status);

    this.editedOrder = JSON.parse(JSON.stringify(this.selectedOrder));
    this.newOrder = false;
    this.displayEditDialog = true;
  }

  getCurrentDateDayOperation(day: number): Date {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + day);
    return currentDate;
  }

  saveAssignment() {
    console.log("saving assignment!" + JSON.stringify(this.editedOrder) + " for "+JSON.stringify(this.assignedEngineer.engineer));
    this.displayAssignDialog = false;
    this.userService.assignWorkOrder(this.assignedEngineer.engineer, this.editedOrder, this.isNewOrderOwner)
        .subscribe(json => this.updateOrderStatus(json.created, this.isNewOrderOwner, this.editedOrder, this.assignedEngineer.engineer));
  }

  private updateOrderStatus(created: number, isNewOrderOwner:boolean, order: Order, engineer: User):void {
    if (!created) {
      console.log("Assignment problem! "+created); //todo show dialog in notification service
      return;
    }
    else if (isNewOrderOwner && order.statusCode != "AS") { //update status
      console.log("Setting status to AS, current "+order.statusCode);
      order.statusCode = "AS";
    }

    this.woService.updateOrder(order).subscribe(updatedOrder => this.refreshTable(updatedOrder, false));
  }

  saveOrder() {

    this.editedOrder.typeCode = this.newOrder? "OP": this.workType.code;
    this.editedOrder.type = this.dictService.getWorkType(this.editedOrder.typeCode);
    this.editedOrder.statusCode = this.status.code;
    this.editedOrder.status = this.dictService.getWorkStatus(this.editedOrder.statusCode);

    if(this.newOrder) {
      console.log("saving new!" + JSON.stringify(this.editedOrder));
      this.woService.addOrder(this.editedOrder).subscribe(createdOrder => this.refreshTable(createdOrder, this.newOrder))
    } else {
      console.log("changing!" + JSON.stringify(this.editedOrder));
      this.woService.updateOrder(this.editedOrder).subscribe(updatedOrder => this.refreshTable(updatedOrder, this.newOrder))
    }
  }

  refreshTable(order: Order, newOrder: boolean) {
    console.log("Refreshing table with order "+JSON.stringify(order));

    if (newOrder && order && order.id > 0) {
      this.orders.push(order);
      this.orders = JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
      this.displayEditDialog = false;
      return;
    }

    if (!newOrder && order.id > 0) {
      let index: number = this.findSelectedOrderIndex(order);
      console.log("refresh index: "+index);
      this.orders[index] = order;
      this.orders =  JSON.parse(JSON.stringify(this.orders)); //immutable dirty trick
      this.displayEditDialog = false;
      return;
    }

    console.log("todo show alert something went wrong!");
  }

  findSelectedOrderIndex(order: Order): number {
    let index: number = 0;
    for (let tabOrder of this.orders) {
      if (order.id === tabOrder.id) {
        return index;
      }
      index++;
    }
    return -1;
  }
}

export class SearchEnginner {
  constructor(
      public displayName: string,
      public engineer: User
  ){}
}


