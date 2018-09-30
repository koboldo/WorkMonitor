/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var logErrAndCall = require('../local_util').logErrAndCall;
var dbUtil = require('./db_util');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 

var queries = {
    getTimesheet: 
    `SELECT PERSON_ID, ROUND(CAST(USED_TIME AS DOUBLE)/3600.0,2) AS USED_TIME, BREAK/60 AS BREAK, TRAINING/60 AS TRAINING, IS_LEAVE, DATETIME(FROM_DATE,"unixepoch","localtime") AS FROM_DATE, DATETIME(TO_DATE,"unixepoch","localtime") AS TO_DATE, (PC.FIRST_NAME || " " || PC.LAST_NAME) AS CREATED_BY, (PM.FIRST_NAME || " " || PM.LAST_NAME) AS MODIFIED_BY 
    FROM TIME_SHEET TS LEFT JOIN PERSON PC ON TS.CREATED_BY = PC.ID LEFT JOIN PERSON PM ON TS.MODIFIED_BY = PM.ID WHERE %(personId)s AND %(workDate)s`,
    getTimesheets: 
    `WITH MYL(N) AS (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)),
    MY_FROM_DATE(T) AS (VALUES (%(workDateAfter)s)),
    MY_TO_DATE(T) AS (VALUES (%(workDateBefore)s))    
    SELECT P.ID AS PERSON_ID, FD.T+86400*(M3.N*100+M2.N*10+M1.N) AS SWD , COALESCE(DATETIME(TS.FROM_DATE,"unixepoch","localtime"), DATETIME(FD.T + 86400 * (M3.N * 100 + M2.N * 10 + M1.N),"unixepoch")) FROM_DATE, COALESCE(DATETIME(TS.TO_DATE,"unixepoch","localtime"), DATETIME(FD.T + 86400 * (M3.N * 100 + M2.N * 10 + M1.N),"unixepoch")) TO_DATE, COALESCE(ROUND(CAST(TS.USED_TIME AS DOUBLE)/3600.0,2),0) AS USED_TIME, COALESCE(TS.BREAK/60,0) AS BREAK, COALESCE(TRAINING/60,0) AS TRAINING, COALESCE(TS.IS_LEAVE,'N') AS IS_LEAVE, (PC.FIRST_NAME || " " || PC.LAST_NAME) AS CREATED_BY, (PM.FIRST_NAME || " " || PM.LAST_NAME) AS MODIFIED_BY 
    FROM MYL M1, MYL M2, MYL M3, MY_FROM_DATE FD, MY_TO_DATE TD, PERSON P 
        LEFT JOIN TIME_SHEET TS ON P.ID = TS.PERSON_ID AND SWD = TS.WORK_DATE LEFT JOIN PERSON PC ON TS.CREATED_BY = PC.ID LEFT JOIN PERSON PM ON TS.CREATED_BY = PM.ID
    WHERE SWD <= (TD.T)*1 %(personId)s
    ORDER BY 1,3`,    
    insertLeave:
    `WITH MYL(N) AS (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9))
    , MY_FROM_DATE(T) AS (VALUES (%(FROM_DATE)s))
    , MY_TO_DATE(T) AS (VALUES (%(TO_DATE)s))
    INSERT INTO TIME_SHEET(
        PERSON_ID, WORK_DATE, USED_TIME, FROM_DATE, TO_DATE, IS_LEAVE, CREATED_BY, BREAK )
    SELECT
        %(PERSON_ID)s, FD.T+86400*(M3.N*100+M2.N*10+M1.N), 8*60*60, FD.T+86400*(M3.N*100+M2.N*10+M1.N), FD.T+86400*(M3.N*100+M2.N*10+M1.N)+8*60*60, "Y", %(CREATED_BY)s, 0
    FROM
        MYL M1, MYL M2,MYL M3, MY_FROM_DATE FD, MY_TO_DATE TD 
    WHERE 
        M3.N*100+M2.N*10+M1.N <= (TD.T-FD.T)/86400 AND (FD.T + 86400*(M3.N*100+M2.N*10+M1.N)) NOT IN (SELECT H.HDATE FROM HOLIDAYS H)`
};

var filters = {
    getTimesheet: {
        personId: 'TS.PERSON_ID = %(personId)s',
        workDate: 'TS.WORK_DATE = CAST(STRFTIME("%%s","%(workDate)s","start of day") AS INTEGER)',
    },    
    getTimesheets: {
        workDateBefore: 'CAST(STRFTIME("%%s","%(workDateBefore)s","start of day") AS INTEGER)',
        workDateAfter: 'CAST(STRFTIME("%%s","%(workDateAfter)s","start of day") AS INTEGER)',
        personId: 'AND P.ID = %(personId)s'
    },
    insertLeave:{
        FROM_DATE: 'CAST(STRFTIME("%%s","%(FROM_DATE)s","start of day") AS INTEGER)',
        TO_DATE: 'CAST(STRFTIME("%%s","%(TO_DATE)s","start of day") AS INTEGER)',
        PERSON_ID: '%(PERSON_ID)s',
        CREATED_BY: '%(CREATED_BY)s'
    }
};

var timeSheets_db = {
        
    readAll: function(params, cb) {
        var db = dbUtil.getDatabase();
        
        var query = dbUtil.prepareFiltersByInsertion(queries.getTimesheets,params,filters.getTimesheets);
        var getTimesheetsStat = db.prepare(query);
		getTimesheetsStat.all(function(err, rows) {
            getTimesheetsStat.finalize();
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
        var query = dbUtil.prepareFiltersByInsertion(queries.getTimesheet,params,filters.getTimesheet);
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
        timeSheet.WORK_DATE = `STRFTIME('%s','${timeSheet.WORK_DATE}','start of day')`;

        if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = `STRFTIME('%s','${timeSheet.FROM_DATE}','utc')`; 
        if(timeSheet.TO_DATE)   timeSheet.TO_DATE = `STRFTIME('%s','${timeSheet.TO_DATE}','utc')`;       
        if(timeSheet.BREAK)     timeSheet.BREAK = `${timeSheet.BREAK}*60`;
        if(timeSheet.TRAINING)  timeSheet.TRAINING = `${timeSheet.TRAINING}*60`;
        
        var mydb = dbUtil.getDatabase();

        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, (err, newId) => {
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
                idObj.WORK_DATE = `(SELECT ${timeSheet.WORK_DATE})`;
                delete timeSheet.CREATED_BY;

                dbUtil.performUpdate(idObj, timeSheet, 'TIME_SHEET', (err,result) => {
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

    createLeave: function(leaveSheet, cb) {

        var db = dbUtil.getDatabase();
        var query = dbUtil.prepareFiltersByInsertion(queries.insertLeave,leaveSheet,filters.insertLeave);
        if(logger.isDebugEnabled()) logger.debug('query for insert leave: ' + query);
        var leaveSheetStat = db.prepare(query);
        leaveSheetStat.run((err,result)=>{
            leaveSheetStat.finalize();
            db.close();
            if(err)  {
                logErrAndCall(err,cb);  
            } else {
                this.readAll(
                    {
                        workDateAfter: leaveSheet.FROM_DATE,
                        workDateBefore: leaveSheet.TO_DATE,
                        personId: leaveSheet.PERSON_ID
                    },
                    (err,rows)=>{
                        if(err)  logErrAndCall(err,cb);  
                        else cb(null,rows);
                    }
                );
            }
        });
    }
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
