import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { HttpModule } from '@angular/http';

import { BaseRequestOptions } from '@angular/http';

import { AppComponent }  from './app.component';
import { routing }        from './app.routing';

import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, UserService, WOService, DictService } from './_services/index';
import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { RegisterComponent } from './register/index';
import { WoComponent } from './wo/wo.component';

import { CalendarModule, ButtonModule, SelectButtonModule, DataTableModule, SharedModule, PanelModule,TabViewModule,TabMenuModule,MenuItem,TreeModule,TreeNode,FieldsetModule,DropdownModule,TooltipModule,OverlayPanelModule,DataGridModule }  from 'primeng/primeng';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        TabViewModule,TabMenuModule,PanelModule,DropdownModule,SelectButtonModule,FieldsetModule,ButtonModule,CalendarModule,
        BrowserAnimationsModule,
        DataTableModule,
        routing
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        WoComponent
    ],
    providers: [
        AuthGuard,
        AlertService,
        AuthenticationService,
        UserService,
        BaseRequestOptions,
        WOService,
        DictService
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }