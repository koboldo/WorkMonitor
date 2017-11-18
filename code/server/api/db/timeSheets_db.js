/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');
var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 

var queries = {
	// getAggregatedTime: 'SELECT PERSON_ID, COALESCE( SUM(USED_TIME), 0) AS USED_TIME FROM TIME_SHEET %(filter)s GROUP BY PERSON_ID',
    getAggregatedTime: 'SELECT P.ID AS PERSON_ID, (SELECT COALESCE( SUM(USED_TIME), 0) AS USED_TIME FROM TIME_SHEET AS TS WHERE TS.PERSON_ID = P.ID %(workDateBefore)s %(workDateAfter)s) AS USED_TIME FROM PERSON AS P'
};

var filters = {
    getTimesheets: {
        workDateBefore: 'AND (WORK_DATE/86400) <= (STRFTIME("%%s","%(workDateBefore)s")/86400)',
        workDateAfter: 'AND (WORK_DATE/86400) >= (STRFTIME("%%s","%(workDateAfter)s")/86400)',
        personId: ' WHERE P.ID = %(personId)s',
    }
};

var timeSheets_db = {
        
    readAggregatedTime: function(params, cb) {
        var db = dbUtil.getDatabase();
        
        var query = dbUtil.prepareFiltersByInsertion(queries.getAggregatedTime,params,filters.getTimesheets);
       
        var getAggregatedTimeStat = db.prepare(query);
        
		getAggregatedTimeStat.all(function(err, rows) {
            getAggregatedTimeStat.finalize();
            db.close();
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(rows == null) {
				cb(null,null);
				return;
			}
            cb(null,rows);
		});
    },
    
    create: function(timeSheet, cb) {
        
        if(logger.isDebugEnabled()) logger.debug('insert timeSheet with object: ' + util.inspect(timeSheet));

        if(timeSheet['WORK_DATE']) timeSheet['WORK_DATE'] = 'STRFTIME("%s","' + timeSheet['WORK_DATE'] + '")';

        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = timeSheets_db;
