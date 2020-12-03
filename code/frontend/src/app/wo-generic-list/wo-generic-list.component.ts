import { Component, Input, OnInit } from '@angular/core';
import { Order } from 'app/_models';
import { TableSummary } from 'app/_models/tableSummary';
import { ToolsService, WorkTypeService } from 'app/_services';
import { ExportService } from 'app/_services/export.service';
import { DataTable } from 'primeng/primeng';

@Component({
  selector: 'app-wo-generic-list',
  templateUrl: './wo-generic-list.component.html',
  styleUrls: ['./wo-generic-list.component.css']
})
export class WoGenericListComponent implements OnInit {

  _exportFileName: string;
  cols: any;
  orders: Order[];
  columnsToPipeFormat: string [];
  selectedOrder: Order;
  displayDetailsDialog: boolean;
  summary: TableSummary;

  constructor(private workTypeService: WorkTypeService,
              private toolsService:ToolsService,
              private exportService: ExportService
              ) { }

  ngOnInit() {
    
  }

  @Input()
    set exportFileName(exportFileName: string) {
        this._exportFileName = exportFileName;
    }
    get exportFileName(): string {
        return this._exportFileName;
    }
  @Input()
    set list(orders: Order[]) {
      this.orders = orders;
    }
    get list(): Order[] {
        return this.orders;
    }
  @Input()
    set columns(columns: any){
      this.cols = columns;
    }
    get columns() {
      return this.cols;
    }
  @Input()
    set columnsToPipe(columns: string []){
      this.columnsToPipeFormat = columns;
    }
    get columnsToPipe() {
      return this.columnsToPipeFormat;
    }
    @Input()
    set summaryForTable(summary: TableSummary ){
      this.summary = summary;
    }
    get summaryForTable() {
      return this.summary;
    }
  public customExportCsv (table:DataTable) {
    this.exportService.exportCsvWithPipe(table,this.columnsToPipeFormat);
  }
  public showWoDetails(order) {
    this.selectedOrder = order;
    this.displayDetailsDialog = true;
  }
}
