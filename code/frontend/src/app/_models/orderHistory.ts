

import { User, RelatedItem, Order } from '../_models/index';

/*
 "id": 16,
 "workNo": "KRK11",
 "statusCode": "AS",
 "typeCode": "BU",
 "complexityCode": "STD",
 "complexity": 8,
 "price": 1300,
 "lastModDate": "2018-02-12 15:20:30",
 "creationDate": "2017-10-01 12:55:30",
 "versionDate": "2018-02-12 15:20:45",
 "itemId": 3,
 "ventureId": 7
 */

export class OrderHistory extends Order {
    public versionDate :string;
    public modifiedBy: number;
    public modifiedByFull: User;

}

