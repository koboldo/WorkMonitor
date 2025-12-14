import { Component, OnInit } from '@angular/core';
import { VersionService } from '../_services/index';

@Component({
  selector: 'app-app-version',
  templateUrl: './app-version.component.html',
  styleUrls: ['./app-version.component.css']
})
export class AppVersionComponent implements OnInit {

  showHistory: boolean = false;
  cols: any;

  showHistoryDialog(): void {
    this.showHistory = true;
  }

  constructor(public versionService: VersionService) { }

  ngOnInit() {
      this.cols = [
                  { field: 'code', header: 'Numer', class:"width-50 text-center"},
                  { field: 'paramChar', header: 'Opis', class:"width-135 text-left", breakword: true},
              ]
  }


}
