export class Order {
	//internal backend fields not set by the constuctor
	id: number;
	lastModDate: string;
	creationDate: string;
	protocolNo: string;

	//relater item fields
	itemNo: string;
	itemBuildingType: string;
	itemConstructionCategory: string;
	itemAddress: string;
	itemDescription: string;

	assignee: string[];

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

