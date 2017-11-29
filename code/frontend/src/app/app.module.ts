import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule }     from '@angular/forms';
import { HttpModule } from '@angular/http';

import { BaseRequestOptions } from '@angular/http';

import { AppComponent }  from './app.component';
import { routing }        from './app.routing';

import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, UserService, WOService, DictService, RelatedItemService, WorkTypeService, ToolsService, TimesheetService, HttpInterceptor } from './_services/index';
import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserChangeComponent } from './user-change/user-change.component';
import { WoComponent } from './wo/wo.component';

import { ProgressBarModule, ChartModule, ScheduleModule, GrowlModule, MessagesModule, MessageModule, InputTextModule, InputTextareaModule, InputMaskModule, PasswordModule, AutoCompleteModule, ContextMenuModule, DialogModule, RadioButtonModule, CalendarModule, ButtonModule, SelectButtonModule, DataTableModule, SharedModule, PanelModule,TabViewModule,TabMenuModule,MenuItem,TreeModule,TreeNode,FieldsetModule,DropdownModule,TooltipModule,OverlayPanelModule,DataGridModule }  from 'primeng/primeng';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MyWoComponent } from './my-wo/my-wo.component';
import { TimesheetsComponent } from './timesheets/timesheets.component';
import { ChangeWoComplexityComponent } from './change-wo-complexity/change-wo-complexity.component';
import { ReportUnacceptedOrdersComponent } from './report-unaccepted-orders/report-unaccepted-orders.component';
import { ReportMonitorEngineersComponent } from './report-monitor-engineers/report-monitor-engineers.component';
import { WoClearingComponent } from './wo-clearing/wo-clearing.component';

import 'chart.js/dist/Chart.min.js';
import { ProgressComponent } from './progress/progress.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        ProgressBarModule, OverlayPanelModule, ChartModule, TooltipModule, ScheduleModule, GrowlModule, MessagesModule, MessageModule, InputTextModule, InputTextareaModule, InputMaskModule, PasswordModule, TabViewModule,TabMenuModule,PanelModule,DropdownModule,SelectButtonModule,FieldsetModule,ButtonModule,CalendarModule,RadioButtonModule,DialogModule,ContextMenuModule,AutoCompleteModule,
        BrowserAnimationsModule,
        DataTableModule,
        routing
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        UserRegisterComponent,
        UserChangeComponent,
        WoComponent,
        MyWoComponent,
        TimesheetsComponent,
        ChangeWoComplexityComponent,
        ReportUnacceptedOrdersComponent,
        ReportMonitorEngineersComponent,
        WoClearingComponent,
        ProgressComponent,
        ResetPasswordComponent
    ],
    providers: [
        AuthGuard,
        AlertService,
        AuthenticationService,
        UserService,
        BaseRequestOptions,
        WOService,
        DictService,
        RelatedItemService,
        WorkTypeService,
        ToolsService,
        TimesheetService,
        HttpInterceptor
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }