import { User, RelatedItem, OrderHistory, Comments } from '../_models/index';

export class Order {
    //internal backend fields not set by the constuctor
    id:number;
    lastModDate:string;
    creationDate:string;
    protocolNo:string;

    //related item fields used with GET
    relatedItems:RelatedItem[];

    //used to enforce relation on update and insert of WO
    itemId:number;

    //used to search on p-datatable - copying values from relatedItems[0]
    itemNo:string;
    itemBuildingType:string;
    itemConstructionCategory:string;
    itemAddress:string;
    itemDescription:string;
    itemCreationDate:string;

    ventureId: number;
    ventureDisplay:   string;   //filled by front used in table
    ventureCompany:   string;   //filled by front used in table
    ventureFull:      User;     //filled by front used in edit

    assignee:string[];
    assigneeFull:User[]; //filled by front

    assignedDate: string;   //utilization report
    doneDate: string;       //utilization report
    sharedPrice: number;    //utilization report front calculated shared price among employees,
    poolRevenue: number;    //user payroll -> pool share obtained from completedWo magic string

    history: OrderHistory[];

    officeCode: string;
    office:     string;
    isFromPool: string;

    comment: string;
    sComments: string; //user to filter

    frontProcessingDesc:string

    magicIsFromPool: string;

    constructor(public workNo:string,
                public statusCode:string,
                public status:string,
                public typeCode:string,
                public type:string,
                public complexityCode:string,
                public complexity:number,
                public description:string,
                public comments:Comments,
                public mdCapex:string,
                public price:number) {
    }

}

