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

  orders: Order[];
  selectedOrder: Order;

  constructor(private woService: WOService) { }

  ngOnInit() {
    this.woService.getOrdersByLastMod().subscribe(orders => this.orders = orders);
  }

  onRowSelect(event) {
    console.log("selected row!" + JSON.stringify(this.selectedOrder));
    //this.activites = this.processService.fetchProcess(this.selectedProcess);
  }

}
