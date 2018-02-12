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

    public company: string; //BOT for staff, Play for Ventures
    public agreementCode: string;
    public agreement: string;
    public account: string;
    public phone: string;
    public addressStreet: string;
    public addressPost: string;

    public rankCode: string;
    public rank: string;
    public isFromPool: string;
    public projectFactor: number;


}

/*
 "id": 3,
 "firstName": "Tom",
 "lastName": "Hanks",
 "officeCode": "GDA",
 "roleCode": "MG",
 "email": "thanks@bot.pl",
 "isActive": "Y",
 "workOrders": [
 5,
 20
 ],
 "projectFactor": 1,
 "isFromPool": "Y",
 "company": "Weyland Industries",
 "agreementCode": "UOP",
 "account": "PL441090XXXX",
 "phone": "123543765",
 "position": "some",
 "addressStreet": "my street",
 "addressPost": "my post",
 "office": "Gdańsk",
 "role": [
 "Inżynier",
 "Kierownik"
 ]
 */