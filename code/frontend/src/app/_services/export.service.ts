import { Injectable } from '@angular/core';
import { NumberFormatPipe } from 'app/_pipe/NumberFormatPipe';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor(public formatPipe: NumberFormatPipe) 
  { }

  eksportCSVWithPipe (table: DataTable, columnsToFormat: string []) { 
    table.value.forEach(value=> {
        columnsToFormat.forEach(col => {
          value[col] = this.formatPipe.transform(value[col])
        });     
    });
    table.exportCSV();  
  }
}
