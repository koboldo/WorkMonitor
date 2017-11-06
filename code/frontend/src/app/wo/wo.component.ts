import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Order } from '../_models/order';
import { WOService } from '../_services/wo.service';
import { MenuItem } from 'primeng/primeng';

@Component({
  selector: 'app-wo',
  templateUrl: './wo.component.html',
  styleUrls: ['./wo.component.css']
})
export class WoComponent implements OnInit {

  lastModAfter: Date;
  lastModBefore: Date;
  orders: Order[];
  selectedOrder: Order;


  editedOrder: Order;
  newOrder: boolean;
  displayEditDialog: boolean;
  displayAssignDialog: boolean;
  items: MenuItem[];


  constructor(private woService: WOService) {
    this.lastModAfter = this.getCurrentDateDayOperation(-61);
    this.lastModBefore = this.getCurrentDateDayOperation(1);
    this.items = [
      {label: 'Przypisz', icon: 'fa-share', command: (event) => this.assign()},
      {label: 'Dodaj', icon: 'fa-plus', command: (event) => this.add()},
      {label: 'Edycja', icon: 'fa-pencil-square-o', command: (event) => this.edit()}
    ];
  }

  ngOnInit() {
    this.search();
  }

  search() {
    this.woService.getOrdersByDates(
        this.lastModAfter.toISOString().substring(0, 10),
        this.lastModBefore.toISOString().substring(0, 10)
    ).subscribe(orders => this.orders = orders);
  }

  onRowSelect(event) {
    console.log("selected row!" + JSON.stringify(this.selectedOrder));
    //this.activites = this.processService.fetchProcess(this.selectedProcess);
  }

  assign(): void {
    console.log("assigning!" + JSON.stringify(this.selectedOrder));
    this.newOrder = false;
    this.editedOrder = this.selectedOrder;
    this.displayAssignDialog = true;
  }

  add() {
    this.editedOrder = new Order(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.newOrder = true;
    this.displayEditDialog = true;
  }

  edit(): void {
    console.log("editing!" + JSON.stringify(this.selectedOrder));
    this.editedOrder = this.selectedOrder;
    this.newOrder = false;
    this.displayEditDialog = true;
  }

  getCurrentDateDayOperation(day: number): Date {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + day);
    return currentDate;
  }

  saveAssignment() {
    console.log("saving assignment!" + JSON.stringify(this.editedOrder));
    this.displayAssignDialog = false;
  }

  save() {
    console.log("saving!" + JSON.stringify(this.editedOrder));

    if(this.newOrder) {
      console.log("This is new order");
      this.orders.push(this.editedOrder);
    } else {
      console.log("This is changing order");
      this.orders[this.findSelectedOrderIndex()] = this.editedOrder;
    }

    this.editedOrder = null;
    this.displayEditDialog = false;

    //todo save backend
  }

  findSelectedOrderIndex(): number {
    return this.orders.indexOf(this.selectedOrder);
  }

}
