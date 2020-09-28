import { Injectable } from '@angular/core';
import { NumberFormatPipe } from 'app/_pipe/NumberFormatPipe';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor(public formatPipe: NumberFormatPipe) 
  { }

  eksportCSVWithPipe (table: DataTable, columnToFormat: any) {
    table.value.forEach(value=> {
      if (value.columnToFormat) {
        value.columnToFormat = this.formatPipe.transform(value.columnToFormat);
      }      
    });
    table.exportCSV();  
  }
}
