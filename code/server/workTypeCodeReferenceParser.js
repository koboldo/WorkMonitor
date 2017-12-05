/* jshint node: true, esversion: 6 */
'use strict';

var parse = require('csv-parse');
var fs = require('fs');
var dbUtil = require('./api/db/db_util');


var inFilename = '/home/laros/projects/BOT/TYPY_WO.csv';
var outFilename = '/home/laros/projects/BOT/WORK_TYPE_CODE_REFERENCE.sql';

var fieldMap = [
	{ sourceName: null, targetName: 'CODE_TABLE', mod: mapCodeTable },
    //{ sourceName: 'POZ_UM', targetName: 'POZ_UM', mod: null },
    //{ sourceName: 'LONG_DESC', targetName: 'LONG_DESC', mod: null },
    //{ sourceName: 'PRICE', targetName: 'PRICE', mod: null },
    { sourceName: 'TYPE', targetName: 'CODE', mod: null },
    //{ sourceName: 'CATEGORY', targetName: 'OFFICE_CODE', mod: null },
    { sourceName: 'DESC', targetName: 'PARAM_CHARVAL', mod: mapDesc },
    //{ sourceName: 'STD', targetName: 'STD', mod: null },
    //{ sourceName: 'HDR', targetName: 'HRD', mod: null },
    //{ sourceName: 'OTHER', targetName: 'OTHER', mod: null }
];

function mapCodeTable(record) {
    return "WORK_TYPE";
};

function mapDesc(record) {
	if (record.TYPE.startsWith("0")) {
		return record.TYPE + ' - (WEWNĘTRZNE) ' + record.DESC;
	} 
    return record.TYPE + ' - ' + record.DESC;
};

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

fs.readFile(inFilename, 'utf8', (err,data) => {
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
        for(var i = 0; i < records.length; i++) {
            if(records[i].TYPE == null || records[i].TYPE == '') continue;
            // console.log(JSON.stringify(records[i]));
            var nrec = mapRecord(records[i]);
           
            var sql = dbUtil.prepareInsert(nrec, 'CODE_REFERENCE');
            sqls.push(sql);
             
            
            //sqls.push(nrec);
        }

        fs.writeFile(outFilename, sqls.join(';\n'), (err) => {  
            if(err) {
                console.log('writign failed');
                return console.log(err);           
            }
            console.log('sqls saved');
        });
    });
  });


