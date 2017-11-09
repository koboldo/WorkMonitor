export class Order {
	id: number;
	lastModDate: string;
	creationDate: string;
	protocolNo: string;


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
		public mdBuildingType: string,
		public mdConstructionCategory: string,
		public price: number,
		public address: string
	){}
}

