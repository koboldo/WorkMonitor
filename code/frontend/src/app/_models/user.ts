export class User {
    public id: number;
    public email: string;    //person
    public password: string;
    public firstName: string;
    public lastName: string;
    public token: string;
    public roleCode: string[];
    public role: string[];
    public officeCode: string;
    public office: string;
    public isActive: string;
    public workOrders: number[];
    public company: string;
}

/*
 {
 "firstName": "Morgan",
 "lastName": "Freeman",
 "officeCode": "GDA",
 "roleCode": "EN",
 "email": "mfreeman@gmail.com",
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