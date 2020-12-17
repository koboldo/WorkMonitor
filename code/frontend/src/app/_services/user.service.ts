import {Injectable} from '@angular/core';

import {User, Order, UserReport, MonthlyUserReport} from '../_models/index';
import {HttpBotWrapper} from '../_services/httpBotWrapper.service';
import {DictService} from '../_services/dict.service';
import {ToolsService} from '../_services/tools.service';
import {Observable} from 'rxjs';
import {catchError, map, tap, delay, mergeMap} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {SelectItem} from 'primeng/api';


@Injectable()
export class UserService {
  constructor(private http: HttpBotWrapper, private dictService: DictService, private toolsService: ToolsService) {
    console.log("created UserService");
  }


  getById(id: number): Observable<any> {
    return this.http.get('/api/v1/persons/' + id).pipe(map((response: Object) => response));
  }

  create(user: User) {
    return this.http.post('/api/v1/persons/', user).pipe(map((response: Object) => response));
  }

  update(user: User, effectiveDateItem: SelectItem, isAlwaysFromStartOfCurrentMonth) {
    //let strippedUser: User = JSON.parse(JSON.stringify(user, this.toolsService.censorUser));
    let strippedUser: User = JSON.parse(JSON.stringify(user));
    strippedUser.workOrders = undefined;

    let effectiveDate = this.getEffectiveDate(effectiveDateItem, isAlwaysFromStartOfCurrentMonth);

    if (effectiveDate == null) {
      return this.http.put('/api/v1/persons/' + strippedUser.id, strippedUser).pipe(map((response: Object) => response));
    } else {
      return this.http.put('/api/v1/persons/' + strippedUser.id +
          '?effectiveDate=' + this.toolsService.formatDate(effectiveDate, 'yyyy-MM-dd'), strippedUser).pipe(map((response: Object) => response));
    }
  }

  sendResetEmail(email: string): Observable<any> {
    let msg: any = {};
    msg.email = email;
    return this.http.post('/pwdreset', msg).pipe(map((response: Object) => response));
  }


  resetPassword(userId: string, hash: string, newPassword: string): any {
    let msg: any = {id: userId, password: newPassword, hash: hash};
    return this.http.put('/pwdreset', msg).pipe(map((response: Object) => response));
  }

  assignWorkOrder(user: User, order: Order, isNewOrderOwner: boolean): Observable<any> {
    if (isNewOrderOwner && order.assignee !== undefined && order.assignee.length > 0) {
      return this.addRelation(true, user, order);
    } else {
      return this.addRelation(false, user, order);
    }
  }

  /* sqlite could not handle
  private deleteAllAssignees(assigneeIds: number[], orderId: number) {
      let observableBatch = [];

      for(let assigneeId of assigneeIds) {
          observableBatch.push(
              this.http.delete('/api/v1/persons/' + assigneeId + '/order/'+orderId, this.authService.getAuthOptions()).
              map((response:Object) => this.getRelationDeleteResult(response))
          );
      }

      return Observable.forkJoin(observableBatch);
  }


  getRelationDeleteResult(response: any) : number {
      console.log("delete result= "+JSON.stringify(response));

      if (response.deleted === 1) {
          console.log("Old relation (assignment) removed successfully");
          return 1;
      } else if (response.deleted === 0) {
          console.log("there was no relation deleted - we are optimistic");
          return 1;
      } else {
          console.log("there unimplemented: "+response.deleted);
          return -1;
      }

  }
   */

  private getEffectiveDate(effectiveDateItem: SelectItem, isAlwaysFromStartOfCurrentMonth): any {
    let effectiveDate = null;
    // juggling-check testing undefined and null in one comparison
    if (effectiveDateItem != null && effectiveDateItem.value != null) {
      effectiveDate = effectiveDateItem.value;
    } else if (isAlwaysFromStartOfCurrentMonth) {
      let date = new Date();
      effectiveDate = new Date(date.getFullYear(), date.getMonth());
    }
    return effectiveDate;
  }

  private handleError(error: any): Observable<any> {
    console.error('An error occurred: ', error); // for demo purposes only
    return EMPTY;
  }

  private addRelation(detach: boolean, user: User, order: Order): Observable<any> {
    return this.http.post('/api/v1/persons/' + user.id + '/order/' + order.id + (detach ? "?detach=true" : ""), order);
  }

  public deleteRelation(user: User, order: Order): Observable<any> {
    return this.http.delete('/api/v1/persons/' + user.id + '/order/' + order.id).pipe(map((response: Object) => response));
  }

  public getUtilizationReportData(dateAfter: string, dateBefore: string): Observable<MonthlyUserReport[]> {
    return this.http.get('/api//v1/report/personOrders?dateAfter=' + dateAfter + "&dateBefore=" + dateBefore).pipe(
        map((response: Object) => this.getAllUserReport(response))
    ) as Observable<MonthlyUserReport[]>;
    // (response['list'])

  }

  public getEngineers(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN"])));
  }

  public getStaff(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "OP"])));
  }

  public getActiveStaff(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "OP"]).filter(x => x.isActive === 'Y')));
  }

  public getAllStaff(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "OP", "PR", "AN", "CL", "PA"])));
  }

  public getEngineersAndVentureRepresentatives(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "VE"])));
  }

  public getAllButPR(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "OP", "VE", "CN"])));
  }

  getAll() {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["PR", "MG", "EN", "OP", "VE", "AN", "CL", "PA", "CN"])));
  }

  getContractors() {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["CN", "VE"])));
  }

  getEngineersAndContractors(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["MG", "EN", "CN"])));
  }

  public getManagedUsers(role: string[], fetchVentures: boolean): Observable<User[]> {
    if (role && role.indexOf('PR') > -1) {
      return this.getStaff();
    } else {
      if (fetchVentures) {
        return this.getEngineersAndVentureRepresentatives();
      }
      return this.getEngineers();
    }
  }

  public getHistoryById(id: number) {
    return this.http.get('/api/v1/persons/history/' + id).pipe(map((response: Object) => this.getAllByRole(response, ["VE", "EN", "MG", "OP", "AN", "CL"])));
  }

  public getVentureRepresentatives(): Observable<User[]> {
    return this.http.get('/api/v1/persons').pipe(map((response: Object) => this.getAllByRole(response, ["VE"])));
  }

  private hasAnyRole(sourceRoleCodes: string[], user: User): boolean {
    for (let role of user.roleCode) {
      if (sourceRoleCodes.indexOf(role) > -1) {
        return true;
      }
    }
  }

  // private helper methods
  private getAllByRole(response: any, roleCodes: string[]): User[] {
    let users: User[] = [];

    console.log("getAllByRole for " + JSON.stringify(roleCodes));

    if (response.list && response.list.length > 0) {
      for (let user of response.list) {

        //console.log("getAllByRole processing user "+JSON.stringify(user, this.toolsService.censorUser));
        console.log("getAllByRole processing user " + JSON.stringify(user));

        if (user.roleCode && user.roleCode.length && this.hasAnyRole(roleCodes, user)) {


          if (user.officeCode) {
            console.log("trying for " + user.officeCode + " from " + JSON.stringify(this.dictService.getOffices()));
            user.office = this.dictService.getOffice(user.officeCode);
          }

          if (user.agreementCode) {
            console.log("trying for " + user.agreementCode + " from " + JSON.stringify(this.dictService.getAgreements()));
            user.agreement = this.dictService.getAgreement(user.agreementCode);
          }

          if (user.rankCode) {
            console.log("trying for " + user.rankCode + " from " + JSON.stringify(this.dictService.getRanks()));
            user.rank = this.dictService.getRank(user.rankCode);
          }

          user.role = [];
          for (let roleCode of user.roleCode) {
            user.role.push(this.dictService.getRole(roleCode));
          }

          //console.log("getAllByRole pushing user "+JSON.stringify(user, this.toolsService.censorUser));
          console.log("getAllByRole pushing user " + JSON.stringify(user));
          users.push(user);

        }
      }
    }

    return users;
  }

  private getAllUserReport(response: any): UserReport[] {
    let users: UserReport[] = [];
    if (response.list && response.list.length > 0) {

      for (let user of response.list) {
        if (user.roleCode != 'CN') {
          for (let order of user.workOrders) {
            order.statusCode ? order.status = this.dictService.getWorkStatus(order.statusCode) : '?';
            this.shareRevenue(user, order, response.list);
          }
          users.push(user);
        } else {
          console.log('debug ' + JSON.stringify(user));
        }
      }

    }
    return users;
  }

  private shareRevenue(user: User, order: Order, users: UserReport[]): void {
    let sharedCounter: number = 1;
    if ((order.typeCode === '1.1' || order.typeCode === '8.2' || order.typeCode === '10.1')) {

      for (let currUser of users) {
        for (let currOrder of currUser.workOrders) {
          if (currUser.id != user.id && order.id === currOrder.id) {
            sharedCounter++;
          }
        }
      }
    }
    if (sharedCounter > 1) {
      console.log('Sharing revenue for ' + order.id + ', ' + order.workNo + ' among ' + sharedCounter + ' employees');
    }
    order.sharedPrice = order.price / sharedCounter;
  }
}