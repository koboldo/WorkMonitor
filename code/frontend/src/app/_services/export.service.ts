import { Injectable, Output } from '@angular/core';
import { DataTable } from 'primeng/primeng';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

constructor() 
  { }
     /**
   * @description Zapisuje dane w csv , zamienia kropkę na przecinek
   * @param table Tabela do eksportu
   * @param columnsToFormat Kolumny jakie mają być zmienione 
   * @param options Paramet opcjonalny, określa dodakowe opcje eksportu do csv z obiektu @type DataTable
   * 
   */
    exportCsvWithPipe (table: DataTable, columnsToFormat: string [], options?:any) { 
      let isOptions = options ? true: false  ;
      if (table.value && columnsToFormat){
        table.value.forEach(record=> {
          columnsToFormat.forEach(col => {
            if (record[col] ) {
              record[col] = record[col].toString().replace('.',',');
            }            
          });     
      });
      if (options) {
        table.exportCSV(options);
      } else {
        table.exportCSV();
      } 
        table.value.forEach(record=> {
          columnsToFormat.forEach(col => {
            if (record[col]) {
              record[col] = Number(record[col].toString().replace(',','.'));
            }               
          });     
      });
    }

  }
}
