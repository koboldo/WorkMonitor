import { Routes, RouterModule } from '@angular/router';

import { AppComponent }  from './app.component';
import { HomeComponent } from './home/index';
import { WoComponent } from './wo/wo.component';
import { LoginComponent } from './login/index';
import { RegisterComponent } from './register/index';
import { AuthGuard } from './_guards/index';

const appRoutes: Routes = [
    { path: '',                         component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'logme',                    component: LoginComponent },
    { path: 'addPerson',                component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'workOrders',               component: WoComponent,       canActivate: [AuthGuard] },
    { path: 'myWorkOrders',             component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'addTimesheet',             component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'workOrderComplexity',      component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'clearing',                 component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'workMonitor',              component: RegisterComponent, canActivate: [AuthGuard] },
    { path: 'unacceptedWork',           component: RegisterComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '', canActivate: [AuthGuard] }
];


export const routing = RouterModule.forRoot(appRoutes);