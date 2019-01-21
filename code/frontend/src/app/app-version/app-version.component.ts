import { Component, OnInit } from '@angular/core';
import { VersionService } from '../_services/index';

@Component({
  selector: 'app-app-version',
  templateUrl: './app-version.component.html',
  styleUrls: ['./app-version.component.css']
})
export class AppVersionComponent implements OnInit {

  showHistory: boolean = false;

  showHistoryDialog(): void {
    this.showHistory = true;
  }

  constructor(public versionService: VersionService) { }

  ngOnInit() {
  }


}
