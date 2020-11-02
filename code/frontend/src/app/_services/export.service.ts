import { Injectable, Output } from '@angular/core';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor() 
  { }

    exportCsvWithPipe (table: DataTable, columnsToFormat: string [], options?:any) { 
      if (table.value && columnsToFormat){
        table.value.forEach(record=> {
          columnsToFormat.forEach(col => {
            record[col] = record[col].toString().replace('.',',');             
          });     
      });
      if (options) {
        table.exportCSV(options);
      } else {
        table.exportCSV();
      } 
        table.value.forEach(record=> {
        columnsToFormat.forEach(col => {        
          record[col] = Number(record[col].toString().replace(',','.'));       
        });     
    });
      }

  }
}
