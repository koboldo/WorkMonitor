import { User, RelatedItem } from '../_models/index';

export class Order {
	//internal backend fields not set by the constuctor
	id: number;
	lastModDate: string;
	creationDate: string;
	protocolNo: string;

	//related item fields used with GET
	itemId: number;
	itemNo: string;
	itemBuildingType: string;
	itemConstructionCategory: string;
	itemAddress: string;
	itemDescription: string;
	itemCreationDate: string;

	assignee: string[];
	assigneeFull: User[]; //filled by front

	constructor(
		public workNo: string,
		public statusCode: string,
		public status: string,
		public typeCode: string,
		public type: string,
		public complexityCode: string,
		public complexity: string,
		public description: string,
		public comment: string,
		public mdCapex: string,
		public price: number
	){}
}

