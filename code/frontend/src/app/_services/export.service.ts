import { Injectable, Output } from '@angular/core';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor() 
  { }

    eksportCSVWithPipe (table: DataTable, columnsToFormat: string []) { 
      table.value.forEach(record=> {
          columnsToFormat.forEach(col => {
            if (record[col] != null && record[col] != undefined){
              record[col] = record[col].toString().replace('.',',');
            }       
          });     
      });
      table.exportCSV();
      table.value.forEach(record=> {
        columnsToFormat.forEach(col => {
          if (record[col] != null && record[col] != undefined){
            record[col] = Number(record[col].toString().replace(',','.'));
          }
        });     
    });
  }
}
