import { Injectable } from '@angular/core';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor() 
  { }

  eksportCSVWithPipe (table: DataTable, columnsToFormat: string []) { 
    table.value.forEach(value=> {
        columnsToFormat.forEach(col => {
          value[col] = value[col].toString().replace('.',',');
        });     
    });
    table.exportCSV();
    table.value.forEach(value=> {
      columnsToFormat.forEach(col => {
        value[col] = Number(value[col].toString().replace(',','.'));
      });     
  });
  }
}
