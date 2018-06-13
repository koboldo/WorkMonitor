/* jshint node: true, esversion: 6 */
'use strict';

const process = require('process');
const fs = require('fs');
const moment = require('moment');


let idBase = 8;
let outputFilename = 'testActions.json';

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}

if(!Array.prototype.last) {
    Array.prototype.last = function last() {
        return (this.length > 0) ? this[this.length - 1] : null;
    };
}

function prepareFilled(size,start = 0) {
    return Array.from(Array(size).keys(),(val)=>val+start);
}

class Maker {
    constructor(baseId) {
        this.baseId = baseId; 
        this.actions = [];

        this.typeMaps = {
            "1.1S": {
                "typeCode": "1.1",
                "complexity": "8",
                "complexityCode": "STD",
                "price": "420"
            },
            "4.1H": {
                "typeCode": "4.1",
                "complexity": "25.2",
                "complexityCode": "HRD",
                "price": "1400"
            },
            "OTS": {
                "typeCode": "2.1",
                "complexity": "0",
                "complexityCode": "STD",
                "price": "1400"
            }
        }

        this.generateOrderNo = ()=>{
            return 'TESTWO_' + (this.baseId++).toString().padStart(6,'0');
        };

        this.generateIntegerSeries = (length, limit)=>{
            let series = [];
            for(let i = 0; i < length; i++) {
                let newnum;
                do {
                    newnum = Math.round(Math.random() * limit);
                } while(series.indexOf(newnum) > -1);
                series.push(newnum);
            }
            return series.sort((a,b)=>{ return a - b;}).reverse();
        };

        this.dateAdjuster = (periodDate,seq)=>{
            return (adjustRequired = true) => { 
                return (adjustRequired) 
                    ? periodDate.clone().add(seq.pop(),'days').format('YYYY-MM-DD') 
                    : periodDate.clone().add(seq.last(),'days').format('YYYY-MM-DD');
            };
        };

        this.typeResolver = (typeCode) => {
            return () => { return this.typeMaps[typeCode]; };
        };

        this.reproduce = (persons, multiplier, func, ...args)=>{
            
            let obj = this;
            persons.forEach((person)=>{
                let m = (!Number.isInteger(multiplier) || multiplier < 0) ? 1 : multiplier;
                while(m--) func.call(obj,person,...args);
            });
        };

        this.createTimesheets = (persons, periodDate, dateOffsets, duration, breakTime) => {
            persons.forEach((person)=>{
                dateOffsets.forEach((dateOffset)=>{
                    this.actions.push({
                        "actionName": "addTimesheet",
                        "date": periodDate.clone().add(dateOffset,'days').format('YYYY-MM-DD'),
                        "role": "operator",
                        "arg": {
                            "personId": person,
                            "from": periodDate.clone().add(dateOffset,'days').add(8,'hours').format('YYYY-MM-DD HH:mm:ss'),
                            "to": periodDate.clone().add(dateOffset,'days').add(8,'hours').add(duration,'hours').format('YYYY-MM-DD HH:mm:ss'),
                            "break": breakTime
                        }
                    });                    
                });
            });
        };

		this.createLeaveTimesheets = (persons, periodDate, dateOffsets) => {
            persons.forEach((person)=>{
                dateOffsets.forEach((dateOffset)=>{
                    this.actions.push({
                        "actionName": "addLeaveTimesheet",
                        "date": periodDate.clone().add(dateOffset,'days').format('YYYY-MM-DD'),
                        "role": "operator",
                        "arg": {
                            "personId": person,
                            "from": periodDate.clone().add(dateOffset,'days').add(8,'hours').format('YYYY-MM-DD HH:mm:ss'),
                            "to": periodDate.clone().add(dateOffset,'days').add(8,'hours').add(8,'hours').format('YYYY-MM-DD HH:mm:ss')
                        }
                    });                    
                });
            });
        };
		
        this.createStandardOrderFlow = (personId, periodDate, typeCode)=>{
            let woNo = this.generateOrderNo();
            let seq = this.generateIntegerSeries(5,(periodDate.daysInMonth()-1));
            let adj = this.dateAdjuster(periodDate,seq);
            let res = this.typeResolver(typeCode);

            this.actions.push({
                "actionName": "createOrder",
                "date": adj(),
                "role": "operator",
                "arg": Object.assign({
                            "workNo": woNo,
                            "itemId": 20,
                            "ventureId": 2,
                            "officeCode": "WAW"
                            },res())
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(false),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });
            
            this.actions.push({
                "actionName": "assignOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "personId": personId
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "IS"
                }
            });            
        };

        this.createRepairedOrderFlow = (personId, periodDate, typeCode)=>{
            let woNo = this.generateOrderNo();
            let seq = this.generateIntegerSeries(9,(periodDate.daysInMonth()-1));
            let adj = this.dateAdjuster(periodDate,seq);
            let res = this.typeResolver(typeCode);

            this.actions.push({
                "actionName": "createOrder",
                "date": adj(),
                "role": "operator",
                "arg": Object.assign({
                            "workNo": woNo,
                            "itemId": 20,
                            "ventureId": 2,
                            "officeCode": "WAW"
                            },res())
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(false),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });
            
            this.actions.push({
                "actionName": "assignOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "personId": personId
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });            

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });            

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "IS"
                }
            });            
        };

        this.createRepairedInTwoMonthsOrderFlow = (personId, periodDate, typeCode)=>{
            let woNo = this.generateOrderNo();
            let seq = this.generateIntegerSeries(3,(periodDate.daysInMonth()-1));
            let adj = this.dateAdjuster(periodDate,seq);
            let res = this.typeResolver(typeCode);

            this.actions.push({
                "actionName": "createOrder",
                "date": adj(),
                "role": "operator",
                "arg": Object.assign({
                            "workNo": woNo,
                            "itemId": 20,
                            "ventureId": 2,
                            "officeCode": "WAW"
                            },res())
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(false),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });
            
            this.actions.push({
                "actionName": "assignOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "personId": personId
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });

            let nextPeriodDate = periodDate.clone().add(1,'month');
            seq = this.generateIntegerSeries(5,(nextPeriodDate.daysInMonth()-1));
            adj = this.dateAdjuster(nextPeriodDate,seq);

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });            

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });            

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "IS"
                }
            });            
        };

        this.createJustFinishedOrderFlow = (personId, periodDate, typeCode)=>{
            let woNo = this.generateOrderNo();
            let seq = this.generateIntegerSeries(5,(periodDate.daysInMonth()-1));
            let adj = this.dateAdjuster(periodDate,seq);
            let res = this.typeResolver(typeCode);

            this.actions.push({
                "actionName": "createOrder",
                "date": adj(),
                "role": "operator",
                "arg": Object.assign({
                            "workNo": woNo,
                            "itemId": 20,
                            "ventureId": 2,
                            "officeCode": "WAW"
                            },res())
            });
            
            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(false),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "AS"
                }
            });
            
            this.actions.push({
                "actionName": "assignOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "personId": personId
                }
            });

            this.actions.push({
                "actionName": "updateOrder",
                "date": adj(),
                "role": "operator",
                "arg": {
                    "workNo": woNo,
                    "statusCode": "CO"
                }
            });           
        };        
    }
}

let maker = new Maker(idBase);
let myPeriodDate = moment('2018-01-01');
let myPeriodDate2 = moment('2018-02-01');
let myPeriodDate3 = moment('2018-03-01');

let poolUsers = [84,85,86,87,88,89,90];
let nonpoolUsers = [80,81,82];

// maker.createStandardOrderFlow(55,moment('2018-01-01'),"1.1S");
//SCENARIO 1 - only pool users, no nonpool orders, no leave
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);

//SCENARIO 2 - only pool users, some nonpool orders, no leave
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.reproduce(poolUsers.slice(0,2), 2, maker.createStandardOrderFlow, myPeriodDate, "OTS");
// maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);

//SCENARIO 3 - only pool users, some leave
// maker.reproduce(poolUsers.slice(0,5), 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers.slice(0,5), 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers.slice(0,5), myPeriodDate, prepareFilled(22), 8.5, 30);
// maker.reproduce(poolUsers.slice(5), 1, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers.slice(5), 1, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers.slice(5), myPeriodDate, prepareFilled(18), 8.5, 30);
// maker.createLeaveTimesheets(poolUsers.slice(5),myPeriodDate,prepareFilled(4,21));

//SCENARIO 4 -  pool and non-pool users, some nonpool orders for pool users, some pool orders for non-pool users, leave for non-pool
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.reproduce(poolUsers.slice(0,2), 2, maker.createStandardOrderFlow, myPeriodDate, "OTS");
// maker.reproduce(nonpoolUsers, 2, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);
// maker.createTimesheets(nonpoolUsers, myPeriodDate, prepareFilled(18), 8.5, 30);
// maker.createLeaveTimesheets(nonpoolUsers,myPeriodDate,prepareFilled(4,21));

//SCENARIO 5 - only pool users, just finished orders, no leave
// maker.reproduce(poolUsers, 2, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 2, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.reproduce(poolUsers, 1, maker.createJustFinishedOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 1, maker.createJustFinishedOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);

//SCENARIO 6 - only pool users, repaired orders, no leave
// maker.reproduce(poolUsers, 2, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 2, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.reproduce(poolUsers, 1, maker.createRepairedOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 1, maker.createRepairedOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);

//SCENARIO 7 - only pool user, no orders, some leave
// maker.createTimesheets(poolUsers.slice(6), myPeriodDate, prepareFilled(18), 8.5, 30);
// maker.createLeaveTimesheets(poolUsers.slice(6),myPeriodDate,prepareFilled(4,21));

//SCENARIO 8 - only pool users, overtime, no leave
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers.slice(0,6), myPeriodDate, prepareFilled(22), 8.5, 30);
// maker.createTimesheets(poolUsers.slice(6), myPeriodDate, prepareFilled(22), 10.5, 30);

//SCENARIO 9 - only pool users, repaired case with first CO before period
// maker.reproduce(poolUsers, 2, maker.createStandardOrderFlow, myPeriodDate2, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate2, "4.1H");
// maker.reproduce(poolUsers, 2, maker.createRepairedInTwoMonthsOrderFlow, myPeriodDate, "1.1S");
// maker.createTimesheets(poolUsers, myPeriodDate2, prepareFilled(20), 8.5, 30);

//SCENARIO 10 - only pool users, no nonpool orders, no leave
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate, "4.1H");
// maker.createTimesheets(poolUsers, myPeriodDate, prepareFilled(22), 8.5, 30);

// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate2, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate2, "4.1H");
// maker.createTimesheets(poolUsers, myPeriodDate2, prepareFilled(20), 8.5, 30);

// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate3, "1.1S");
// maker.reproduce(poolUsers, 3, maker.createStandardOrderFlow, myPeriodDate3, "4.1H");
// maker.createTimesheets(poolUsers, myPeriodDate3, prepareFilled(22), 8.5, 30);


fs.writeFileSync(outputFilename,JSON.stringify(maker.actions, null, '  '));
