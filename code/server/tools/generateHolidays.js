/* jshint node: true, esversion: 6 */
'use strict';
/**
 * Simple generator of sql inserts with holidays dates in Poland
 * For different period change initial values for 'startYear' and/or 'period' variables
 */
let startYear = 2017;
let period = 15;

const Holidays = require('date-holidays');
require('datejs');

let hd = new Holidays('PL');
let years = new Array(period).fill(1).map((val, idx)=> startYear + idx);

years.forEach((year)=>{
    hd.getHolidays(year).filter(element=>(element.type == 'public') ? true : false).forEach((element, index)=>{
        // console.log('idx:' + index + ' ' + element.name + ' ' + element.start.toLocaleDateString('PL',{ year: 'numeric', month: '2-digit', day: '2-digit' }));
        // console.log('idx:' + index + ' ' + element.name + ' ' + element.start.toISOString().substring(0,19));
        let HDATE = element.start.toLocaleDateString('PL',{ year: 'numeric', month: '2-digit', day: '2-digit' });
        let DESC = element.name;
        console.log(`INSERT INTO HOLIDAYS (HDATE,DESC) VAlUES (STRFTIME("%s","${HDATE}"),"${DESC}");`);
    });
});


let startDate = Date.parse(`${startYear}-01-01T12:00:00`);
let finishDate = startDate.clone().addYears(15);

let cdate = startDate.clone().first().saturday();
while(cdate < finishDate) {
    let HDATE = cdate.toISOString().substring(0,10);
    let DESC = 'Saturday';
    console.log(`INSERT INTO HOLIDAYS (HDATE,DESC) VAlUES (STRFTIME("%s","${HDATE}"),"${DESC}");`);
    cdate.addDays(7); 
}


cdate = startDate.clone().first().sunday();
while(cdate < finishDate) {
    let HDATE = cdate.toISOString().substring(0,10);
    let DESC = 'Sunday';
    console.log(`INSERT INTO HOLIDAYS (HDATE,DESC) VAlUES (STRFTIME("%s","${HDATE}"),"${DESC}");`);
    cdate.addDays(7); 
}

