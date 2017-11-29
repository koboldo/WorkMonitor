import { Routes, RouterModule } from '@angular/router';

import { AppComponent }  from './app.component';
import { HomeComponent } from './home/index';
import { WoComponent } from './wo/wo.component';
import { LoginComponent } from './login/index';
import { UserResetPasswordComponent } from './user-reset-password/user-reset-password.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserChangeComponent } from './user-change/user-change.component';
import { AuthGuard } from './_guards/index';

import { MyWoComponent } from './my-wo/my-wo.component';
import { TimesheetsComponent } from './timesheets/timesheets.component';
import { ChangeWoComplexityComponent } from './change-wo-complexity/change-wo-complexity.component';
import { ReportUnacceptedOrdersComponent } from './report-unaccepted-orders/report-unaccepted-orders.component';
import { ReportMonitorEngineersComponent } from './report-monitor-engineers/report-monitor-engineers.component';
import { WoClearingComponent } from './wo-clearing/wo-clearing.component';

const appRoutes: Routes = [
    { path: '',                         component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'logme',                    component: LoginComponent },
    { path: 'resetPassword',            component: UserResetPasswordComponent },
    { path: 'addPerson',                component: UserRegisterComponent, canActivate: [AuthGuard] },
    { path: 'changePerson',             component: UserChangeComponent, canActivate: [AuthGuard] },
    { path: 'workOrders',               component: WoComponent,       canActivate: [AuthGuard] },
    { path: 'myWorkOrders',             component: MyWoComponent,     canActivate: [AuthGuard] },
    { path: 'addTimesheet',             component: TimesheetsComponent, canActivate: [AuthGuard] },
    { path: 'workOrderComplexity',      component: ChangeWoComplexityComponent, canActivate: [AuthGuard] },
    { path: 'clearing',                 component: WoClearingComponent, canActivate: [AuthGuard] },
    { path: 'workMonitor',              component: ReportMonitorEngineersComponent, canActivate: [AuthGuard] },
    { path: 'unacceptedWork',           component: ReportUnacceptedOrdersComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '', canActivate: [AuthGuard] }
];


export const routing = RouterModule.forRoot(appRoutes);
