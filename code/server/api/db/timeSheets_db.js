/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var logErrAndCall = require('../local_util').logErrAndCall;
var dbUtil = require('./db_util');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 

var queries = {
    getAllTimesheet: 'SELECT PERSON_ID, ROUND(CAST(USED_TIME AS DOUBLE)/3600.0,2) USED_TIME, BREAK/60, DATETIME(FROM_DATE,"unixepoch") AS FROM_DATE, DATETIME(TO_DATE,"unixepoch") AS TO_DATE FROM TIME_SHEET WHERE %(personId)s AND %(workDate)s',
    // getAllTimesheets: 'SELECT PERSON_ID, USED_TIME, BREAK, STRFTIME("%%Y-%%m-%%d",DATETIME(WORK_DATE,"unixepoch")) AS WORK_DATE, STRFTIME("%%H:%%M",DATETIME(FROM_DATE,"unixepoch")) AS FROM_DATE, STRFTIME("%%H:%%M",DATETIME(TO_DATE,"unixepoch")) AS TO_DATE FROM TIME_SHEET WHERE 1=1 %(workDateBefore)s %(workDateAfter)s',
    getAllTimesheets: 
    `WITH MYL(N) AS (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9))
    SELECT P.ID PERSON_ID, %(workDateAfter)s+86400*(M3.N*100+M2.N*10+M1.N) AS SWD , DATETIME(COALESCE(TS.FROM_DATE,%(workDateAfter)s+86400*(M3.N*100+M2.N*10+M1.N)),"unixepoch") FROM_DATE, DATETIME(COALESCE(TS.TO_DATE,%(workDateAfter)s+86400*(M3.N*100+M2.N*10+M1.N)),"unixepoch") TO_DATE, COALESCE(ROUND(CAST(TS.USED_TIME AS DOUBLE)/3600.0,2),0) AS USED_TIME, COALESCE(TS.BREAK/60,0) AS BREAK
    FROM MYL M1, MYL M2, MYL M3, PERSON P 
        LEFT JOIN TIME_SHEET TS ON P.ID = TS.PERSON_ID AND SWD = TS.WORK_DATE
    WHERE SWD <= (%(workDateBefore)s)*1
    ORDER BY 1,3`
};

var filters = {
    getTimesheet: {
        personId: 'PERSON_ID = %(personId)s',
        workDate: 'WORK_DATE = (STRFTIME("%%s","%(workDate)s")/86400)*86400',
    },
    // getTimesheets: {
    //     workDateBefore: 'AND (WORK_DATE/86400) <= (STRFTIME("%%s","%(workDateBefore)s")/86400)',
    //     workDateAfter: 'AND (WORK_DATE/86400) >= (STRFTIME("%%s","%(workDateAfter)s")/86400)',
    // }
    getTimesheets: {
        workDateBefore: 'STRFTIME("%%s","%(workDateBefore)s")',
        workDateAfter: 'STRFTIME("%%s","%(workDateAfter)s")',
    }    
};

var timeSheets_db = {
        
    readAll: function(params, cb) {
        var db = dbUtil.getDatabase();
        
        var query = dbUtil.prepareFiltersByInsertion(queries.getAllTimesheets,params,filters.getTimesheets);
        var getAllTimesheetsStat = db.prepare(query);
		getAllTimesheetsStat.all(function(err, rows) {
            getAllTimesheetsStat.finalize();
            db.close();
			if(err) return logErrAndCall(err,cb);
			
			if(rows == null) {
				cb(null,null);
				return;
			}
            cb(null,rows);
		});        
    },
    
    read: function(params, cb) {
        var db = dbUtil.getDatabase();
        var query = dbUtil.prepareFiltersByInsertion(queries.getAllTimesheet,params,filters.getTimesheet);
        var getTimesheetStat = db.prepare(query);
        getTimesheetStat.get((err,row)=>{
            getTimesheetStat.finalize();
            db.close();

            if(err) return logErrAndCall(err,cb);
            cb(null, row);
        });
    },

    create: function(timeSheet, cb) {
        
        let workDateCopy = timeSheet.WORK_DATE;
        timeSheet.WORK_DATE = `(STRFTIME("%s","${timeSheet.WORK_DATE}")/86400)*86400`;

        if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = `STRFTIME("%s","${timeSheet.FROM_DATE}")`; 
        if(timeSheet.TO_DATE)   timeSheet.TO_DATE = `STRFTIME("%s","${timeSheet.TO_DATE}")`;       
        if(timeSheet.BREAK)     timeSheet.BREAK = `${timeSheet.BREAK}*60`;

        var mydb = dbUtil.getDatabase();

        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, (err, newId) => {
            console.log('after insert err ' + (err ? err.name : '') + ' result ' + newId );
            let updating = false;
            if(err) {  
                logErrAndCall(err,cb);  
            } else if(newId) {
                this.read(
                    {personId: timeSheet.PERSON_ID, workDate: workDateCopy},
                    (err,row)=>{
                                  cb(null, 0, row);
                            }); 
                        
            } else {
                updating = true;
                var idObj = {};
                idObj.PERSON_ID = timeSheet.PERSON_ID;
                idObj.WORK_DATE = timeSheet.WORK_DATE;
                dbUtil.performUpdate(idObj, timeSheet, 'TIME_SHEET', (err,result) => {
                    console.log('after update err ' + (err ? err.name : '') + ' result ' + result );
                    if(err)  logErrAndCall(err,cb);  
                    else if(result) { 
                        this.read(
                            {personId: timeSheet.PERSON_ID, workDate: workDateCopy},
                            (err,row)=>{
                                cb(null, 1, row);
                                });
                    }
                    mydb.close();
                }, mydb);    
            }
            if(!updating) mydb.close();
        }, mydb);
    },

/**
    bulkCreate: function(timeSheets, cb) {

        if(logger.isDebugEnabled()) logger.debug('bulk insert for timeSheet list of length: ' + timeSheets.length);

        var mydb = dbUtil.getDatabase();

        var calls = [];
        calls.push(function(_cb) {
            dbUtil.startTx(mydb,function(err, result){
                if(err) _cb(err);
                else _cb(null,result);
            });
        });
        
        timeSheets.forEach((timeSheet) => {
            if(timeSheet.WORK_DATE) timeSheet.WORK_DATE = '(STRFTIME("%s","' + timeSheet.WORK_DATE + '")/86400)*86400';
            if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = timeSheet.FROM_DATE/1000; 
            if(timeSheet.TO_DATE)   timeSheet.TO_DATE = timeSheet.TO_DATE/1000;
            //if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = 'STRFTIME("%s","' + timeSheet.FROM_DATE + '")'; 
            //if(timeSheet.TO_DATE)   timeSheet.TO_DATE = 'STRFTIME("%s","' + timeSheet.TO_DATE + '")';
            calls.push(
                function(_cb) {
                    dbUtil.performInsert(timeSheet,'TIME_SHEET',null,function(err,singleResult){
                        if(err) _cb(err);
                        else _cb(null,singleResult);
                    }, mydb);	
                });
            calls.push(
                function(_cb) {
                    var idObj = {};
                    idObj.PERSON_ID = timeSheet.PERSON_ID;
                    idObj.WORK_DATE = timeSheet.WORK_DATE;
                    dbUtil.performUpdate(idObj, timeSheet, 'TIME_SHEET', function(err,singleResult){
                        if(err) _cb(err);
                        else _cb(null,singleResult);
                    }, mydb);
                }
            );
        });

        async.series(
            calls,
            function(err, results) {
				if(err) {
					dbUtil.rollbackTx(mydb);
					return local_util.logErrAndCall(err,cb);
				} else {
					dbUtil.commitTx(mydb);
					cb(null,1);
				}
		});
    }
*/
};

module.exports = timeSheets_db;
