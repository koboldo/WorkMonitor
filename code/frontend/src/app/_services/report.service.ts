import { Injectable } from '@angular/core';
import { UserReport } from 'app/_models';
import { UserUtilizationIconAndColor } from 'app/_models/userUtilizationIconAndColor';
import { SelectItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

constructor() { }
    
  public getIconAndColorForUserUtilization (utilization: number, holidays:number, noTimesheets:number) : UserUtilizationIconAndColor  {
      if (utilization > 100) {
        return (new UserUtilizationIconAndColor("fa fa-trophy", "green"));
    } else if (utilization >= 80) {
        return (new UserUtilizationIconAndColor("fa fa-thumbs-up", "green"));
    } else if (utilization > 40 && utilization < 80) {
        return (new UserUtilizationIconAndColor("fa fa-bell", "orange"));
    } else if (utilization > 0) {
        return (new UserUtilizationIconAndColor("fa fa-thumbs-down", "red"));
    } else if (utilization == 0) {
        return (new UserUtilizationIconAndColor("fa fa-exclamation", "#902828"));
    } else if (utilization == holidays) {
        return (new UserUtilizationIconAndColor("fa fa-hotel", "grey"));
    } else if (utilization == noTimesheets) {
        return (new UserUtilizationIconAndColor("fa fa-question-circle", "darkgrey"));
    }
  }

  public getRatingCollectionForDropDown () : SelectItem[] {
    let collection: SelectItem [] = [ 
        { styleClass: 'black', value:0, label: 'Wszystkie'},
        { icon: 'fa fa-trophy', styleClass: 'green', value:1, label: ' '},
        { icon: 'fa fa-thumbs-up', styleClass: 'green', value:2, label: ' '},
        { icon: 'fa fa-bell', styleClass: 'orange', value:3, label: ' '},
        { icon: 'fa fa-thumbs-down', styleClass: 'red', value:4, label: ' '},
        { icon: 'fa fa-exclamation', styleClass: '#902828', value:5, label: ' '},
        { icon: 'fa fa-hotel', styleClass: 'grey', value:6, label: ' '},
        { icon: 'fa fa-question-circle', styleClass: 'darkgrey', value:7, label: ' '},
     ]  ;
    return collection;
  }
}
