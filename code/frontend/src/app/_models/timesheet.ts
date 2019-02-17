export class Timesheet {

  constructor(public personId: number,
              public from: string,
              public to: string) {
  }

  public break: string;       // backend assumes minutes
  public usedTime: number;
  public isLeave: string;
  public createdBy: string;
  public modifiedBy: string;
  public training: string;    // backend assumes minutes eg.120 instead of 2:00

  public fromIp: string; // 89.79.57.238
  public fromIsp: string; // UPC Polska
  public fromCity: string; // Warsaw
  public fromMobileDevice: string; // N

  public toIp: string; // 89.79.57.238
  public toIsp: string; // UPC Polska
  public toCity: string; // Warsaw
  public toMobileDevice: string; // N
}

