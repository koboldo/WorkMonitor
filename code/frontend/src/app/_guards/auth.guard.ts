import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../_services/index';
import { User } from '../_models/user';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router, private authService:AuthenticationService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        console.log("AuthGuard canActivate...");
        return this.authService.userAsObs
            .map((user: User) => {
                if (user && user.token){
                    return true;
                }
                this.router.navigate(['/logme']);
                return false;
            });

    }
}