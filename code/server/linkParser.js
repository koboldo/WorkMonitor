/* jshint node: true, esversion: 6 */
'use strict';

const parse = require('csv-parse/lib/sync');
const fs = require('fs');

let inFilename = 'C:/MyArea/work/WorkMonitor/data/2017_RAPORT_1.csv';
let outFilename = 'C:/MyArea/work/WorkMonitor/data/2017_RAPORT_1.sql';
let inFilename2 = 'C:/MyArea/work/WorkMonitor/data/2017_RAPORT_2.csv';
let outFilename2 = 'C:/MyArea/work/WorkMonitor/data/2017_RAPORT_2.sql';

//{ sourceName: 'SOURCE_COLUMN', targetName: 'TARGET_COLUMN', mod: MODIFIER_FUNCTION, format: FORMAT_FUNCTION },
let linkMappings = [
    { sourceName: 'PERSON', targetName: 'PERSON', mod: toTitleCase },
    { sourceName: 'ITEM_NO', targetName: 'ITEM_NO' },
    { sourceName: 'PRICE', targetName: 'PRICE' },
    { sourceName: 'HANDOVER', targetName: 'HANDOVER' },
    { sourceName: 'FINISH', targetName: 'FINISH'}
];

let nameReplace = [
    { src: 'magda miczek', dest: 'magdalena miczek'},
    { src: 'marta burza', dest: 'marta burza bernacka'},
    { src: 'maciek firmanty', dest: 'maciej firmanty'},
    { src: 'mateusz prykiel', dest: 'mateusz prygiel'},
    { src: 'maja michalina ptaszek', dest: 'maja ptaszek'},
    { src: 'michał maciej dybowski', dest: 'michał dybowski'},
    { src: 'kuba wojtaszczyk', dest: 'jakub wojtaszczyk'},
    { src: 'kornel miczek', dest: 'korneliusz miczek'},
];


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

function toTitleCase(record) {
    let person = record.PERSON.trim();
    nameReplace.forEach((nreplace)=>{
        if(person.indexOf(nreplace.src) > -1)
            person = person.replace(nreplace.src, nreplace.dest);
    });
    let tokens = person.split(' ');
    let newTokens = [];
    tokens.forEach((token)=>{
        newTokens.push(token.charAt(0).toUpperCase() + token.substr(1).toLowerCase())
    });
    return newTokens.join(' ');
}

function mapRecord(oldRecord) {

    let newRecord = {};
    linkMappings.forEach((field)=>{
        if(field.mod) {
            newRecord[field.targetName] = field.mod(oldRecord);
        }
        else if(oldRecord[field.sourceName] != null && oldRecord[field.sourceName] != '' ) newRecord[field.targetName] = oldRecord[field.sourceName].trim();
    });
    links.push(newRecord);
    
}

function handleParsingResult(records) {
    for(let idx in records) {
        if(idx <= 1 ||records[idx].ITEM_NO == null || records[idx].ITEM_NO == '' || records[idx].PRICE == '') continue;
        mapRecord(records[idx]);
    }
}

function formatLinks() {
    console.log('links length ' + links.length);
    links.forEach((link)=>{
        // sqls.push(formatInsert(link,'LINK',linkMappings));
        // sqls.push(JSON.stringify(link));
        let PERSON = link.PERSON;
        let ITEM_NO = link.ITEM_NO;
        let PRICE = link.PRICE;
        let HANDOVER = link.HANDOVER;

        sqls.push( `INSERT INTO PERSON_WO (PERSON_ID, WO_ID, CREATED)
        SELECT (
            SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
        ),(
            SELECT ID FROM WORK_ORDER 
            WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
                AND ABS(PRICE - ${PRICE}) <= PRICE * 0.15  
        ), STRFTIME("%s","now")
        WHERE
            EXISTS(
                SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
            ) AND
            EXISTS(
                SELECT ID FROM WORK_ORDER 
                WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
                AND ABS(PRICE - ${PRICE}) <= PRICE * 0.15 
            )`);

        // sqls.push( `INSERT INTO PERSON_WO (PERSON_ID, WO_ID, CREATED)
        // SELECT (
        //     SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
        // ),(
        //     SELECT ID FROM WORK_ORDER 
        //     WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //         AND ABS(TOTAL_PRICE - ${PRICE}) <= TOTAL_PRICE * 0.1  
        //         AND ( ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7
        //         OR ABS(CREATED - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7 )
        // ), STRFTIME("%s","now")
        // WHERE
        //     EXISTS(
        //         SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
        //     ) AND
        //     EXISTS(
        //         SELECT ID FROM WORK_ORDER 
        //         WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //         AND ABS(TOTAL_PRICE - ${PRICE}) <= TOTAL_PRICE * 0.1 AND ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7    
        //     )`);


        // sqls.push( `INSERT INTO PERSON_WO (PERSON_ID, WO_ID, CREATED)
        // SELECT (
        //     SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
        // ),(
        //     SELECT ID FROM WORK_ORDER 
        //     WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //         AND TOTAL_PRICE = ${PRICE} AND ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7
        // ), STRFTIME("%s","now")
        // WHERE
        //     EXISTS(
        //         SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
        //     ) AND
        //     EXISTS(
        //         SELECT ID FROM WORK_ORDER 
        //         WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //         AND TOTAL_PRICE = ${PRICE} AND ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7    
        //     )`);

        // ----- REPORT -----
        sqls.push(`INSERT INTO IMPORT_LOG (TXT)
            SELECT "LACK OF PERSON;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
            WHERE
                NOT EXISTS(
                    SELECT ID FROM PERSON WHERE (FIRST_NAME || ' ' || LAST_NAME) = '${PERSON}'
                )`);
        sqls.push(`INSERT INTO IMPORT_LOG (TXT)
            SELECT "LACK OF ITEM NO;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
            WHERE
                NOT EXISTS(
                    SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}'
                )`);
        // sqls.push(`INSERT INTO IMPORT_LOG (TXT)
        //     SELECT "NO WO WITH GIVEN DATE;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
        //     WHERE
        //         NOT EXISTS(
        //             SELECT ID FROM WORK_ORDER 
        //             WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //             AND ( ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7
        //                 OR ABS(CREATED - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7 )
        //         )`);

        // sqls.push(`INSERT INTO IMPORT_LOG (TXT)
        //         SELECT "PRICE DIFFERENCE LESS THAN 10%;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
        //         WHERE
        //             EXISTS(
        //                 SELECT ID FROM WORK_ORDER 
        //                 WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //                 AND ( ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7
        //                     OR ABS(CREATED - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7 )
        //                     AND TOTAL_PRICE <> ${PRICE} AND ABS(TOTAL_PRICE - ${PRICE}) <= TOTAL_PRICE * 0.1 )`);

        // sqls.push(`INSERT INTO IMPORT_LOG (TXT)
        //         SELECT "PRICE DIFFERENCE MORE THAN 10%;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
        //         WHERE
        //             EXISTS(
        //                 SELECT ID FROM WORK_ORDER 
        //                 WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //                 AND ( ABS(LAST_MOD - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7
        //                     OR ABS(CREATED - STRFTIME("%s","${HANDOVER}") ) <= 60 * 60 * 24 * 7 )
        //                     AND TOTAL_PRICE <> ${PRICE} AND ABS(TOTAL_PRICE - ${PRICE}) > TOTAL_PRICE * 0.1 )`);                            

        // NO DATE CHECKS
        // sqls.push(`INSERT INTO IMPORT_LOG (TXT)
        // SELECT "PRICE DIFFERENCE LESS THAN 10%;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
        // WHERE
        //     EXISTS(
        //         SELECT ID FROM WORK_ORDER 
        //         WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
        //             AND ABS(TOTAL_PRICE - ${PRICE}) <= TOTAL_PRICE * 0.1  
        //          )`);         
        sqls.push(`INSERT INTO IMPORT_LOG (TXT)
                SELECT "PRICE DIFFERENCE MORE THAN 15%;" ||  "${PERSON}" || ";" || "${ITEM_NO}" || ";" || "${PRICE}" || ";" || "${HANDOVER}"
                WHERE
                    EXISTS(
                        SELECT ID FROM WORK_ORDER 
                        WHERE ITEM_ID IN ( SELECT ID FROM RELATED_ITEM WHERE ITEM_NO = '${ITEM_NO}' )
                            AND ABS(PRICE - ${PRICE}) > PRICE * 0.15  
                         )`);                            

    });
}

let links = [];
let sqls = [];

function main(inFile,outFile) {
    links.length = 0;
    sqls.length = 0;
    
    try {
        let fileData = fs.readFileSync(inFile, 'utf8');
        let csvs = parse(fileData,{columns: true, delimiter: ';'});
        handleParsingResult(csvs);
        formatLinks();
        console.log('sqls length ' + sqls.length);
        fs.writeFile(outFile, sqls.join(';\n')+';', 'utf-8',(err) => {  
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

main(inFilename,outFilename);
main(inFilename2,outFilename2);
