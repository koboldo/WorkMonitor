/* jshint node: true, esversion: 6 */
'use strict';

const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const dbUtil = require('./api/db/db_util');


let inFilename = 'C:/MyArea/work/WorkMonitor/data/WO_WAR_LUKASZ.csv';
let outFilename = 'C:/MyArea/work/WorkMonitor/data/WO_WAR_LUKASZ.sql';

//{ sourceName: 'SOURCE_COLUMN', targetName: 'TARGET_COLUMN', mod: MODIFIER_FUNCTION, format: FORMAT_FUNCTION },
let orderMappings = [
    { sourceName: 'WORK_NO', targetName: 'WORK_NO' },
    { sourceName: 'PROTOCOL_NO', targetName: 'PROTOCOL_NO' },
    { sourceName: 'PRICE', targetName: 'PRICE'},
    { sourceName: 'CREATED', targetName: 'CREATED', format: wrapDateInFunction },
    { sourceName: 'LAST_MOD', targetName: 'LAST_MOD', mod: checkClosedDate, format: wrapDateInFunction },
    { sourceName: 'ITEM_NO', targetName: 'ITEM_ID', format: formatSelectForItem },
    { sourceName: 'TYPE_CODE', targetName: 'COMPLEXITY_CODE', format: formatSelectForComplexityCode },
    { sourceName: 'TYPE_CODE', targetName: 'COMPLEXITY', format: formatSelectForComplexity },
    { sourceName: 'VENTURE_CODE', targetName: 'VENTURE_ID', format: formatSelectForVenture },
    { sourceName: 'PROTOCOL_NO', targetName: 'STATUS_CODE', mod: decodeStatus  },
    { sourceName: 'REF_CODE', targetName: 'DESCRIPTION' },
];

let itemMappings = [
    { sourceName: 'ITEM_NO', targetName: 'ITEM_NO' },
    { sourceName: 'ADDRESS', targetName: 'ADDRESS' , mod: prepareItemAddress},
    { sourceName: 'BUILDING_TYPE', targetName: 'MD_BUILDING_TYPE' },
    { sourceName: 'ADDRESS', targetName: 'DESCRIPTION', mod: prepareItemDescription },
];

let typeCodes = ['1.1','1.2','1.3','2.1','2.2','3.1','3.2','3.3','3.4','3.5','3.6','4.1','4.2','4.3','4.4','4.5','4.6','4.7','4.11','4.12','4.13','4.14','4.15','4.21','4.22','4.23','4.24','4.31','4.32','4.33','4.34','5.1','5.2','5.3','6.1','6.2','6.3','6.4','6.5','6.6','7.1','8.1','8.2','9.1','10.1','11.1','11.2'];

function wrapDateInFunction(value, object) {
    return  `STRFTIME("%s","${value}")`;
}

function formatSelectForVenture(value, object) {
    return `(SELECT ID FROM PERSON WHERE INITIALS = "${value}")`;
}

function formatSelectForItem(value, object) {
    return `(SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = "${value}")`;
}

function formatSelectForComplexityCode(value, object) {
    return `(SELECT COMPLEXITY_CODE FROM WORK_TYPE WHERE TYPE_CODE = "${value}")`;
}

function formatSelectForComplexity(value, object) {
    return `(SELECT COMPLEXITY FROM WORK_TYPE WHERE TYPE_CODE = "${value}")`;
}

function prepareItemDescription(record) {
    if(record.COMMENT_1 != '' && record.COMMENT_2 != '') return record.COMMENT_1.replace(/"/g, '\'') + '|||' + record.COMMENT_2.replace(/"/g, '\'');
    if(record.COMMENT_1 != '') return record.COMMENT_1.replace(/"/g, '\'');
    return record.COMMENT_2.replace(/"/g, '\'');
}

function prepareItemAddress(record) {
    return record.ADDRESS.replace(/"/g, '\'');
}

function checkClosedDate(record){
    if(!record.LAST_MOD || record.LAST_MOD == '') return record.CREATED;
    else return record.LAST_MOD;
}

function decodeStatus(record) {
    let status = record.PROTOCOL_NO.trim();
    //ZAWIESZONE
    if(status.startsWith('c)')) return 'SU';

    //WYDANY
    if(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(status) || status.startsWith('a)')) return 'IS';

    //ZAAKCEPTOWANY
    if(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(record.LAST_MOD.trim())) return 'AC';

    //PRZYPISANY -> ZAMKNIETY
    if(record.TSSR != '') return 'CO';

    //OTWARTY 
    return 'OP';
}

function formatInsert(object, tableName, mappings) {
    let sqlCols = '';
    let sqlVals = '';
    for(let col in object) {

        if(sqlCols.length > 0) sqlCols += ', ';
        if(sqlVals.length > 0) sqlVals += ', ';
        sqlCols +=  col;

        let mapping = mappings.filter((mapping)=>{ 
                return (mapping.targetName == col); 
            })[0];
        if(mapping && mapping.format) sqlVals += mapping.format(object[col], object);
        else sqlVals += '"' + object[col] + '"';
    }

    let insertStr = 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
    return insertStr;
}


function mapRecord(oldRecord) {
    let newItem = {};
    itemMappings.forEach((field)=>{
        if(field.mod) {
            newItem[field.targetName] = field.mod(oldRecord);
        }
        else if(oldRecord[field.sourceName] != null && oldRecord[field.sourceName] != '' ) newItem[field.targetName] = oldRecord[field.sourceName].trim();
    });
    itemsMap.set(newItem.ITEM_NO, newItem);

    let newRecords = getNewRecords(oldRecord);
    newRecords.forEach((newRecord)=>{
        orderMappings.forEach((field)=>{
            if(field.mod) {
                newRecord[field.targetName] = field.mod(oldRecord);
            }
            else if(oldRecord[field.sourceName] != null && oldRecord[field.sourceName] != '' ) newRecord[field.targetName] = oldRecord[field.sourceName].trim();
        });
        orders.push(newRecord);
    });
}

function getNewRecords(oldRecord) {
    let records = [];
    typeCodes.forEach((code)=>{
        if(oldRecord[code] != '') {
            oldRecord.TYPE_CODE = code;
            if(code == '1.1'){
                let price = parseInt(oldRecord.PRICE);
                let factor = parseFloat(oldRecord[code].replace(',','.'));
                let pricePointingToType = Math.ceil(price/factor);

                if(pricePointingToType >= 600) {
                    pricePointingToType -= 600;
                    records.push({TYPE_CODE: '1.1'});
                }
                if(pricePointingToType >= 300) {
                    pricePointingToType -= 300;
                    records.push({TYPE_CODE: '1.2'});
                }
                if(pricePointingToType >= 150) {
                    pricePointingToType -= 150;
                    records.push({TYPE_CODE: '1.3'});
                }

                if(pricePointingToType > 50) console.log('Something is wrong with price and type for WO ' + oldRecord.WORK_NO);
            } else {
                records.push({TYPE_CODE: code});
            }
        }
    });
    return records;
}

function handleParsingResult(records) {
    for(let idx in records) {
        if(idx < 15 || records[idx].WORK_NO == null || records[idx].WORK_NO == '') continue;
        mapRecord(records[idx]);
    }

    console.log('orders length: ' + orders.length);
}

function formatOrders() {
    itemsMap.forEach((item, key, map)=>{
        sqls.push(formatInsert(item,'RELATED_ITEM',itemMappings));
    });

    orders.forEach((order)=>{
        sqls.push(formatInsert(order,'WORK_ORDER',orderMappings));
        // sqls.push(JSON.stringify(order));
    });
}

let orders = [];
let itemsMap = new Map();
let sqls = [];

function main() {
    try {
        let fileData = fs.readFileSync(inFilename, 'utf8');
        let csvs = parse(fileData,{columns: true, delimiter: ';'});
        handleParsingResult(csvs);
        formatOrders();
        console.log('sqls length ' + sqls.length);
        fs.writeFile(outFilename, sqls.join(';\n')+';', 'utf-8',(err) => {  
            if(err) {
                console.log('writing failed');
                return console.log(err);           
            }
            console.log('sqls saved');
        });
    } catch(err) {
        console.log('parsing failed');
        return console.log(err);
    }
}

main();
