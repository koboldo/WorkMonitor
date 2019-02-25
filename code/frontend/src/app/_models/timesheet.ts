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
  public fromOrg: string; // P4 Sp. Z O.O.
  public fromCity: string; // Warsaw
  public fromRegion: string; // Mazowieckie
  public fromMobileDevice: string; // N

  public toIp: string; // 89.79.57.238
  public toIsp: string; // UPC Polska
  public toOrg: string; // P4 Sp. Z O.O.
  public toCity: string; // Warsaw
  public toRegion: string; // Mazowieckie
  public toMobileDevice: string; // N
}

