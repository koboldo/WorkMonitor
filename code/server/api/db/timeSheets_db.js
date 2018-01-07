/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 

var queries = {
    getAllTimesheets: 'SELECT PERSON_ID, USED_TIME, BREAK_IN_MINUTES, STRFTIME("%%Y-%%m-%%d",DATETIME(WORK_DATE,"unixepoch")) AS WORK_DATE, STRFTIME("%%H:%%M",DATETIME(FROM_DATE,"unixepoch")) AS FROM_DATE, STRFTIME("%%H:%%M",DATETIME(TO_DATE,"unixepoch")) AS TO_DATE FROM TIME_SHEET WHERE 1=1 %(workDateBefore)s %(workDateAfter)s',
    // getAggregatedTime: 'SELECT PERSON_ID, COALESCE( SUM(USED_TIME), 0) AS USED_TIME FROM TIME_SHEET %(filter)s GROUP BY PERSON_ID',
    // getAggregatedTime: 'SELECT P.ID AS PERSON_ID, (SELECT COALESCE( SUM(USED_TIME), 0) AS USED_TIME FROM TIME_SHEET AS TS WHERE TS.PERSON_ID = P.ID %(workDateBefore)s %(workDateAfter)s) AS USED_TIME FROM PERSON AS P %(personId)s'
};

var filters = {
    getTimesheets: {
        workDateBefore: 'AND (WORK_DATE/86400) <= (STRFTIME("%%s","%(workDateBefore)s")/86400)',
        workDateAfter: 'AND (WORK_DATE/86400) >= (STRFTIME("%%s","%(workDateAfter)s")/86400)',
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
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(rows == null) {
				cb(null,null);
				return;
			}
            cb(null,rows);
		});        
    },
    
    // readAggregatedTime: function(params, cb) {
    //     var db = dbUtil.getDatabase();
        
    //     var query = dbUtil.prepareFiltersByInsertion(queries.getAggregatedTime,params,filters.getTimesheets);
    //     var getAggregatedTimeStat = db.prepare(query);
        
	// 	getAggregatedTimeStat.all(function(err, rows) {
    //         getAggregatedTimeStat.finalize();
    //         db.close();
	// 		if(err) return local_util.logErrAndCall(err,cb);
			
	// 		if(rows == null) {
	// 			cb(null,null);
	// 			return;
	// 		}
    //         cb(null,rows);
	// 	});
    // },
    
    create: function(timeSheet, cb) {
        
        if(logger.isDebugEnabled()) logger.debug('insert timeSheet with object: ' + util.inspect(timeSheet));

        if(timeSheet.WORK_DATE) timeSheet.WORK_DATE = 'STRFTIME("%s","' + timeSheet.WORK_DATE + '")';
        if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = timeSheet.FROM_DATE/1000; 
        if(timeSheet.TO_DATE)   timeSheet.TO_DATE = timeSheet.TO_DATE/1000;
        //if(timeSheet.FROM_DATE) timeSheet.FROM_DATE = 'STRFTIME("%s","' + timeSheet.FROM_DATE + '")'; 
        //if(timeSheet.TO_DATE)   timeSheet.TO_DATE = 'STRFTIME("%s","' + timeSheet.TO_DATE + '")';

        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    },

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
};

module.exports = timeSheets_db;
