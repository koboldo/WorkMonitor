export class TableSummary {
    
    constructor() {
        this.openOrders = 0;
        this.assignedOrders = 0;
        this.complitedOrders = 0;
        this.closeOrders = 0;
        this.issuedOrders = 0;
        this.summaryPrice = 0;
        this.summaryIsFromPool= 0;
    }

    openOrders: number;
    assignedOrders: number;
    complitedOrders: number;
    closeOrders: number;
    issuedOrders: number;
    summaryPrice: number;
    summaryIsFromPool: number;

}