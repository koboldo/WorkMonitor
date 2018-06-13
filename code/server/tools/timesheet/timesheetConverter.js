/* jshint node: true, esversion: 6 */

const XLSX = require('xlsx');
const moment = require('moment');
const fs = require('fs');

// let fname = 'C:/MyArea/work/WorkMonitor/data/zestawienie_obecności_test.xlsx';
let fname = 'C:/MyArea/work/WorkMonitor/data/zestawienie_obecności_2017.xlsx';
// let fname = 'C:/MyArea/work/WorkMonitor/data/zestawienie_obecności_2018.xlsx';
// for file with 2016
// let dateDelta = (366-2);
//for file with 2018
let dateDelta = (-2);


let names = JSON.parse(fs.readFileSync('names.json', 'utf8'));

function getCell(sheet, colNo, rowNo) {
    return sheet[XLSX.utils.encode_cell({c: colNo, r: rowNo})];
}

function findPersonId(name) {
    if(!name) return null;

    let id = null;
    names.forEach((n)=>{
        if(n.name.normalize() == name.normalize()) id = n.id;
    });
    return id;
}

function main() {
    let workbook = XLSX.readFile(fname);

    let timesheetActions = [];
    workbook.SheetNames.forEach(sheetName => {
        if(!/^[0-9]+/.test(sheetName) ) {
            console.log('----- ' + sheetName + ' doesn\'t match, skipping');
            return;
        }
        // if(sheetName != '2') return;

        let sheet = workbook.Sheets[sheetName];

        console.log(sheetName + ' ' + sheet.B1.v);
        let id = findPersonId(sheet.B1.v);
        if(id == null) return console.log('----- no name match, skipping');

        for(let i = 0; i < 365; i++) {
            try {
                let rowNo = 2 + i;
                
                let dateCell = getCell(sheet, 2, rowNo);
                let tsDate = moment('1900-01-01').add(dateCell.v, 'd').add(dateDelta,'d');

                let inHours = getCell(sheet,3,rowNo);
                let inMinutes = getCell(sheet,4,rowNo);
                
                let outHours = getCell(sheet,8,rowNo);
                let outMinutes = getCell(sheet,9,rowNo);
                
                let inDate = tsDate.clone().add(inHours.v,'h').add(inMinutes.v,'m');
                let outDate = tsDate.clone().add(outHours.v,'h').add(outMinutes.v,'m');

                let leave = getCell(sheet,13,rowNo);
                let isLeave = false;
                
                if(['day off','urlop'].some((e)=>(leave ? leave.v.indexOf(e) >= 0 : false))) {
                    inDate = tsDate.clone().add(8,'h');
                    outDate = tsDate.clone().add(16,'h');
                    isLeave = true;
                }
                
                if(outDate.diff(inDate,'m') == 0 && !leave) continue;

                // console.log(tsDate.format() + ' ' + tsDate.isoWeekday() + ' ' + inDate.format('YYYY-MM-DD HH:mm:ss'));

                let break1 = getCell(sheet,5,rowNo);
                let break2 = getCell(sheet,7,rowNo);
                let totalBreak = (break1 ? break1.v:0) + (break2?break2.v:0);
                
                let action = {};
                if(isLeave) action.actionName = 'addLeaveTimesheet';
                else action.actionName = 'addTimesheet';
                action.role = 'operator';
                action.personName = sheet.B1.v;
                action.arg = {};
                action.arg.personId = id;
                action.arg.from = inDate.format('YYYY-MM-DD HH:mm:ss');
                action.arg.to = outDate.format('YYYY-MM-DD HH:mm:ss');
                if(!isLeave) action.arg.break = totalBreak;

                // let ts = {};
                // ts.name = sheet.B1.v;
                // ts.personId = id;
                // ts.from = inDate.format('YYYY-MM-DD HH:mm:ss');
                // ts.to = outDate.format('YYYY-MM-DD HH:mm:ss');
                // if(isLeave) ts.leave = true;
                // else ts.break = totalBreak;

                timesheetActions.push(action);
            } catch (error) {
                continue;
            }
        }
    });
    fs.writeFileSync('timesheets.json', JSON.stringify(timesheetActions));
}

main();