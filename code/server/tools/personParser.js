/* jshint node: true, esversion: 6 */
'use strict';

var parse = require('csv-parse');
var fs = require('fs');
var dbUtil = require('./api/db/db_util');


var inFilename = 'C:\\MyArea\\work\\WorkMonitor\\data\\ludzie_v2.csv';
var outFilename = 'C:\\MyArea\\work\\WorkMonitor\\data\\ludzie.sql';

var inFilename2 = 'C:\\MyArea\\work\\WorkMonitor\\data\\zlecajacy.csv';
var outFilename2 = 'C:\\MyArea\\work\\WorkMonitor\\data\\zlecajacy.sql';

var fieldMap = [
    { sourceName: 'FIRST_NAME', targetName: 'FIRST_NAME', mod: null },
    { sourceName: 'LAST_NAME', targetName: 'LAST_NAME', mod: null },
    { sourceName: 'INITIALS', targetName: 'INITIALS', mod: null },
    { sourceName: 'EMAIL', targetName: 'EMAIL', mod: mapEmail },
    { sourceName: 'LAST_NAME', targetName: 'LAST_NAME', mod: null },
    { sourceName: 'OFFICE', targetName: 'OFFICE_CODE', mod: mapOffice },
    { sourceName: 'ROLE', targetName: 'ROLE_CODE', mod: mapRole },
    { sourceName: 'POSITION', targetName: 'POSITION', mod: null },
    { sourceName: 'PHONE', targetName: 'PHONE', mod: null },
    { sourceName: 'ADDRESS_STREET', targetName: 'ADDRESS_STREET', mod: null },
    { sourceName: 'ADDRESS_POST', targetName: 'ADDRESS_POST', mod: null },
    { sourceName: 'ACCOUNT', targetName: 'ACCOUNT', mod: null },
    { sourceName: 'COMPANY', targetName: 'COMPANY', mod: null },
    { sourceName: 'PROJECT_FACTOR', targetName: 'PROJECT_FACTOR', mod: convertFactor },
    { sourceName: 'IS_ACTIVE', targetName: 'IS_ACTIVE', mod: mapIsActive },
    { sourceName: 'IS_ACTIVE', targetName: 'PASSWORD', mod: mapPassword },
];

function mapEmail(record) {
    if(record.EMAIL != null && record.EMAIL != '') return record.EMAIL;
    else return 'fake.' + record.FIRST_NAME.trim() + '.' + record.LAST_NAME.trim() + '@botproject.pl';
};

function mapRole(record) {
    for(var idx in roleMap) {
        if(record.ROLE == roleMap[idx].role) return roleMap[idx].code;
    }
    return 'XXX';
};

function mapOffice(record) {
    for(var idx in officeMap) {
        if(record.OFFICE == officeMap[idx].office) return officeMap[idx].code;
    }
    return 'XXX';
}

function mapIsActive(record){
    if(record.IS_ACTIVE != null && record.IS_ACTIVE != '') return 'N';
    else return 'Y';
};

function mapPassword(record) {
    return 'thisIsIt';
};

function convertFactor(record) {
    return (record.PROJECT_FACTOR != '') ? parseFloat(record.PROJECT_FACTOR.replace(',','.')) : 0;
}

var officeMap = [ 
    { office: 'Warszawa', code: 'WAW' },
    { office: 'Katowice', code: 'KAT' },
    { office: 'Poznań', code: 'WAW' }, 
    { office: 'Gdańsk', code: 'GDA' }, 
]

var roleMap = [
    { role: 'PREZES' , code: 'PR' },
    { role: 'KIEROWNIK' , code: 'MG' },
    { role: 'OPERATOR' , code: 'OP' },
    { role: 'INŻYNIER' , code: 'EN' },
    { role: 'PRZEDSTAWICIEL' , code: 'VE' }
]

var mapRecord = (oldRecord) => {
    var newRecord = {};
    fieldMap.forEach((field)=>{
        if(field.mod != null) {
            newRecord[field.targetName] = field.mod(oldRecord);
        }
        else if(oldRecord[field.sourceName] != null && oldRecord[field.sourceName] != '' ) newRecord[field.targetName] = oldRecord[field.sourceName].trim();
    });
    return newRecord;
};

function main(inFile, outFile) {
    fs.readFile(inFile, 'utf8', (err,data) => {
        if (err) {
            console.log('parsing failed');
            return console.log(err);
        }

        parse(data, {columns: true, delimiter: ';'},(err,records)=>{
            if(err) {
                console.log('parsing failed');
                return console.log(err);           
            }

            var sqls = [];
            // var db = dbUtil.getDatabase();
            console.log('records ' + records.length);
            for(var i = 0; i < records.length; i++) {
                if(records[i].LAST_NAME == null || records[i].LAST_NAME == '') continue;
                // console.log(JSON.stringify(records[i]));
                var nrec = mapRecord(records[i]);

                var sql = dbUtil.prepareInsert(nrec, 'PERSON');
                sqls.push(sql);
            }

            fs.writeFile(outFile, sqls.join(';\n')+';', (err) => {  
                if(err) {
                    console.log('writign failed');
                    return console.log(err);           
                }
                console.log('sqls saved');
            });
        });
    });
}

main(inFilename,outFilename);
main(inFilename2,outFilename2);