export class User {
    public id: number;
    public login: string;    //person
    public username: string; //login
    public password: string;
    public firstName: string;
    public lastName: string;
    public token: string;
    public roleCode: string;
    public role: string;
    public officeCode: string;
    public office: string;
    public isActive: string;
    public workOrders: number[];
}

/*
 {
 "firstName": "Morgan",
 "lastName": "Freeman",
 "officeCode": "GDA",
 "roleCode": "EN",
 "login": "mfreeman",
 "isActive": "Y"
 }

 {
 "id": 4,
 "firstName": "Brad",
 "lastName": "Pitt",
 "officeCode": "KRK",
 "roleCode": "EN",
 "workOrders":       [
 7,
 8
 ]
 */