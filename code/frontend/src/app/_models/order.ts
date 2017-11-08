export class Order {
	lastModDate: string;

	constructor(
		public id: number,
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
		public price: number
	){}
}

