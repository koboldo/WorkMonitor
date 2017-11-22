import { Order } from '../_models/order';

/*
 {
     "id": 1,
     "firstName": "Johnny",
     "lastName": "Depp",
     "officeCode": "WAW",
     "roleCode": "EN",
     "email": "jdepp@akap.pl",
        "workOrders": [
         {
             "id": 1,
             "workNo": "WAW1",
             "statusCode": "AS",
             "assignedDate": "2017-11-21 21:49:21"
         },
         {
             "id": 2,
             "workNo": "WAW2",
             "statusCode": "AS",
             "assignedDate": "2017-11-21 21:49:21"
         }
     ]
 }
 */

// cannot extend User as it has property workOrders

export class UserReport {

    id: number;
    firstName: string;
    lastName: string;
    officeCode: string;
    office: string;
    roleCode: string;
    role: string;
    email: string;


    //timesheet
    declaredTime: number;

    //calculateTimeUtilization
    noOrdersDone: number;
    expectedTime: number;
    timeUtilizationPercentage: string;
    icon: string;

    workOrders: Order[];
}