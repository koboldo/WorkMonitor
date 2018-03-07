/* jshint node: true, esversion: 6 */
'use strict';

var parse = require('csv-parse');
var fs = require('fs');
// var dbUtil = require('./api/db/db_util');


// var inFilename = '/home/laros/projects/BOT/TYPY_WO.csv';
// var outFilename = '/home/laros/projects/BOT/WORK_TYPE.sql';

var inFilename = 'C:/MyArea/work/WorkMonitor/data/TYPY_WO.csv';
var outFilename = 'C:/MyArea/work/WorkMonitor/data/WORK_TYPE.sql';

var fieldMapStd = [
	{ sourceName: 'TYPE', targetName: 'TYPE_CODE', mod: null },
	{ sourceName: null, targetName: 'OFFICE_CODE', mod: mapOfficeCode },
    { sourceName: null, targetName: 'COMPLEXITY_CODE', mod: mapStdComplexityCode },
    { sourceName: null, targetName: 'COMPLEXITY', mod: mapStdComplexity },
    { sourceName: 'PRICE', targetName: 'PRICE', mod: null },
];

var fieldMapHrd = [
	{ sourceName: 'TYPE', targetName: 'TYPE_CODE', mod: null },
	{ sourceName: null, targetName: 'OFFICE_CODE', mod: mapOfficeCode },
    { sourceName: null, targetName: 'COMPLEXITY_CODE', mod: mapHrdComplexityCode },
    { sourceName: null, targetName: 'COMPLEXITY', mod: mapHrdComplexity },
    { sourceName: 'PRICE', targetName: 'PRICE', mod: null },
];

function mapOfficeCode(record) {
	return '';
}

function mapStdComplexityCode(record) {
	return 'STD';
}

function mapStdComplexity(record) {
    return record.STD;
}

function mapHrdComplexityCode(record) {
	return 'HRD';
}

function mapHrdComplexity(record) {
    return record.HRD;
}

var columnsToSkip = ['ID','LAST_MOD','CREATED'];
var columnsWithoutQuote = ['WORK_DATE', 'FROM_DATE', 'TO_DATE'];

function prepareInsert(object, tableName) {
    var sqlCols = '';
    var sqlVals = '';
    for(var col in object) {
        if(columnsToSkip.indexOf(col) > -1 ) continue;

        if(sqlCols.length > 0) sqlCols += ', ';
        if(sqlVals.length > 0) sqlVals += ', ';
        sqlCols +=  col;

        if(columnsWithoutQuote.indexOf(col) > -1) sqlVals += object[col];
        else sqlVals += '"' + object[col] + '"';
    }

    var insertStr = 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
    return insertStr;
}

var offices = ["WAW","KAT","POZ"];


var mapRecordStd = (oldRecord) => {
    var newRecord = {};
    fieldMapStd.forEach((field)=>{
        if(field.mod != null) {
            newRecord[field.targetName] = field.mod(oldRecord);
        }
        else if(oldRecord[field.sourceName] != null && oldRecord[field.sourceName] != '' ) newRecord[field.targetName] = oldRecord[field.sourceName].trim();
    });
    return newRecord;
};

var mapRecordHrd = (oldRecord) => {
    var newRecord = {};
    fieldMapHrd.forEach((field)=>{
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
        for(var i = 0; i < records.length; i++) {
            if(records[i].TYPE == null || records[i].TYPE == '') continue;
            
            //console.log(offices.length);
            
            
            for (var j = 0; j < offices.length; j++) {

            	//STD
                var nrecStd = mapRecordStd(records[i]);
                nrecStd.OFFICE_CODE = offices[j];
               
                var sqlStd = prepareInsert(nrecStd, 'WORK_TYPE');
                sqls.push(sqlStd);
                
                //HRD
                var nrecHrd = mapRecordHrd(records[i]);
                nrecHrd.OFFICE_CODE = offices[j];
               
                var sqlHrd = prepareInsert(nrecHrd, 'WORK_TYPE');
                sqls.push(sqlHrd);
            }
            
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


