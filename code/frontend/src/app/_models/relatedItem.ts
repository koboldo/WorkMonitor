
export class RelatedItem {

	/*
	 "id": 1,
	 "itemNo": "WHX12323A",
	 "description": "BAAAAARDZO WIELKA WIEŻA",
	 "mdBuildingType": "WIEŻA ORKÓW 1",
	 "mdConstructionCategory": "WIEŻA STRAŻNICZA",
	 "address": "ul. Hordy 3",
	 "creationDate": "2017-11-15 16:42:39"
	 */

	//non front fields



	constructor(
		public id: number,
		public itemNo: string,
		public description: string,
		public mdBuildingType: string,
		public mdConstructionCategory: string,
		public address: string,
		public creationDate: string
	){}
}

