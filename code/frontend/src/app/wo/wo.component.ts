import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Order } from '../_models/order';
import { WOService } from '../_services/wo.service';

@Component({
  selector: 'app-wo',
  templateUrl: './wo.component.html',
  styleUrls: ['./wo.component.css']
})
export class WoComponent implements OnInit {

  lastModDate: Date;
  orders: Order[];
  selectedOrder: Order;

  constructor(private woService: WOService) {
    this.lastModDate = this.getCurrentDateDayOperation(-61);
  }

  ngOnInit() {
    this.search();
  }

  search() {
    this.woService.getOrdersByLastMod(this.lastModDate.toISOString().substring(0, 10)).subscribe(orders => this.orders = orders);
  }

  onRowSelect(event) {
    console.log("selected row!" + JSON.stringify(this.selectedOrder));
    //this.activites = this.processService.fetchProcess(this.selectedProcess);
  }


  getCurrentDateDayOperation(day: number): Date {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + day);
    return currentDate;
  }

}
