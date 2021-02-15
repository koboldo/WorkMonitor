import { NgModule, LOCALE_ID }      from '@angular/core';

import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl, 'pl');


import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule }     from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BaseRequestOptions } from '@angular/http';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppComponent }  from './app.component';
import { routing }        from './app.routing';

import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, AutoLogoutService, UserService, WOService, DictService, RelatedItemService, WorkTypeService, ToolsService, TimesheetService, PayrollService, HttpBotWrapper, HttpCacheInterceptor, HttpHeadersInterceptor, HttpProgressInterceptor, UserTimeStatsService, ClientDeviceService } from './_services/index';
import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserChangeComponent } from './user-change/user-change.component';
import { WoComponent } from './wo/wo.component';


import {AccordionModule} from 'primeng/accordion'
import {AutoCompleteModule} from 'primeng/autocomplete'
import {ButtonModule} from 'primeng/button'
import {CalendarModule} from 'primeng/calendar'
import {ChartModule} from 'primeng/chart'
import {ColorPickerModule} from 'primeng/colorpicker';
import {ContextMenuModule} from 'primeng/contextmenu'
import {DataGridModule} from 'primeng/datagrid'
import {DataTableModule} from 'primeng/datatable'
import {DialogModule} from 'primeng/dialog'
import {DropdownModule} from 'primeng/dropdown'
import {FieldsetModule} from 'primeng/fieldset'
import {GrowlModule} from 'primeng/growl'
import {InplaceModule} from 'primeng/inplace'
import {InputMaskModule} from 'primeng/inputmask'
import {InputTextareaModule} from 'primeng/inputtextarea'
import {InputTextModule} from 'primeng/inputtext'
import {MenubarModule} from 'primeng/menubar'
import {MenuItem} from 'primeng/api'
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';
import {OverlayPanelModule} from 'primeng/overlaypanel'
import {PanelModule} from 'primeng/panel'
import {PasswordModule} from 'primeng/password'
import {ProgressBarModule} from 'primeng/progressbar'
import {ProgressSpinnerModule} from 'primeng/progressspinner'
import {RadioButtonModule} from 'primeng/radiobutton'
import {ScheduleModule} from 'primeng/schedule'
import {SelectButtonModule} from 'primeng/selectbutton'
import {SharedModule} from 'primeng/shared'
import {TabMenuModule} from 'primeng/tabmenu'
import {TabViewModule} from 'primeng/tabview'
import {TooltipModule} from 'primeng/tooltip'
import {TreeModule} from 'primeng/tree'
import {TableModule} from 'primeng/table';
import {ToolbarModule} from 'primeng/toolbar';
import {SliderModule} from 'primeng/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {CheckboxModule} from 'primeng/checkbox';

import { MyWoComponent } from './my-wo/my-wo.component';
import { TimesheetsComponent } from './timesheets/timesheets.component';
import { ChangeWoComplexityComponent } from './change-wo-complexity/change-wo-complexity.component';
import { ReportUnacceptedOrdersComponent } from './report-unaccepted-orders/report-unaccepted-orders.component';
import { ReportMonitorEngineersComponent } from './report-monitor-engineers/report-monitor-engineers.component';
import { WoClearingComponent } from './wo-clearing/wo-clearing.component';

import 'chart.js/dist/Chart.min.js';
import { ProgressComponent } from './progress/progress.component';
import { UserResetPasswordComponent } from './user-reset-password/user-reset-password.component';
import { WoDetailsComponent } from './wo-details/wo-details.component';
import { StatusDetailsComponent } from './status-details/status-details.component';
import { UserAttendanceRegisterComponent } from './user-attendance-register/user-attendance-register.component';
import { UserLeaveComponent } from './user-leave/user-leave.component';
import { WorkTypesComponent } from './work-types/work-types.component';
import { WoSuspendedComponent } from './wo-suspended/wo-suspended.component';
import { UsersDisplayComponent } from './users-display/users-display.component';
import { UsersPayrollComponent } from './users-payroll/users-payroll.component';
import { MyPayrollComponent } from './my-payroll/my-payroll.component';
import { WoListComponent } from './wo-list/wo-list.component';
import { UserHistoryComponent } from './user-history/user-history.component';
import { GroupStatusChangeComponent } from './group-status-change/group-status-change.component';
import { ContractorsComponent } from './contractors/contractors.component';
import { WoStoppedListComponent } from './wo-stopped-list/wo-stopped-list.component';
import { WoCancelledComponent } from './wo-cancelled/wo-cancelled.component';
import { UsersTimeStatsComponent } from './users-time-stats/users-time-stats.component';
import { ReportMonthlyEngineersComponent } from './report-monthly-engineers/report-monthly-engineers.component';
import { AppVersionComponent } from './app-version/app-version.component';
import { GroupAssignmentWoComponent } from './group-assignment-wo/group-assignment-wo.component';
import { WoTrashedComponent } from './wo-trashed/wo-trashed.component';
import { UsersPayrollReportComponent } from './users-payroll-report/users-payroll-report.component';
import { UsersLeaveCancellationComponent } from './users-leave-cancellation/users-leave-cancellation.component';
import { RateValidatorDirective } from './_directives/rateValidator';
import { ProjectFactorValidatorDirective } from './_directives/projectFactorValidator';
import { ExportService } from './_services/export.service';
import { WoGenericListComponent } from './wo-generic-list/wo-generic-list.component';
import { ReportService } from './_services/report.service';



@NgModule({
    imports: [
        HttpClientModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        AccordionModule, ProgressSpinnerModule, InplaceModule, ProgressBarModule, OverlayPanelModule, ChartModule, TooltipModule, ScheduleModule, GrowlModule, MessagesModule, MessageModule, InputTextModule, InputTextareaModule, InputMaskModule, PasswordModule, TabViewModule,TabMenuModule,PanelModule,DropdownModule,SelectButtonModule,FieldsetModule,ButtonModule,CalendarModule,RadioButtonModule,DialogModule,ContextMenuModule,AutoCompleteModule,MenubarModule,ColorPickerModule,ToolbarModule,
        BrowserAnimationsModule,
        TableModule,
        SliderModule,
        DataTableModule,
        routing,
        CheckboxModule
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
        UserResetPasswordComponent,
        WoDetailsComponent,
        StatusDetailsComponent,
        UserAttendanceRegisterComponent,
        UserLeaveComponent,
        WorkTypesComponent,
        WoSuspendedComponent,
        UsersDisplayComponent,
        UsersPayrollComponent,
        MyPayrollComponent,
        WoListComponent,
        UserHistoryComponent,
        GroupStatusChangeComponent,
        ContractorsComponent,
        WoStoppedListComponent,
        WoCancelledComponent,
        UsersTimeStatsComponent,
        AppVersionComponent,
        ReportMonthlyEngineersComponent,
        GroupAssignmentWoComponent,
        WoTrashedComponent,
        UsersPayrollReportComponent,
        UsersLeaveCancellationComponent,
        RateValidatorDirective,
        ProjectFactorValidatorDirective,
      WoGenericListComponent
   ],

    providers: [
        AlertService,
        AuthGuard,
        AuthenticationService,
        AutoLogoutService,
        UserService,
        BaseRequestOptions,
        WOService,
        DictService,
        RelatedItemService,
        WorkTypeService,
        ToolsService,
        TimesheetService,
        PayrollService,
        HttpBotWrapper,
        UserTimeStatsService,
        ClientDeviceService,
        {provide: LOCALE_ID, useValue: 'pl-PL'},
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpHeadersInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpCacheInterceptor,
            multi: true,
        },
        HttpProgressInterceptor,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpProgressInterceptor,
            multi: true,
        },
        ExportService,
        ReportService
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }