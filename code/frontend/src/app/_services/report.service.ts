import { Injectable } from '@angular/core';
import { UserReport } from 'app/_models';
import { UserUtilizationIconAndColor } from 'app/_models/userUtilizationIconAndColor';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

constructor() { }

  public GetIconAndColorForUserUtilization (utilization: number, holidays:number, noTimesheets:number) : UserUtilizationIconAndColor  {
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
}
