'use strict';

var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 

var queries = {
	getAggregatedTime: 'SELECT SUM(USED_TIME) AS USED_TIME FROM TIME_SHEET WHERE PERSON_ID = ? AND WO_ID = ? GROUP BY PERSON_ID, WO_ID',
};


var timeSheets_db = {
        
    readAggregatedTime: function(personId, orderExtId, cb) {
        var db = dbUtil.getDatabase();
        
        var getAggregatedTimeStat = db.prepare(queries.getAggregatedTime);
		getAggregatedTimeStat.bind([personId, orderExtId]);
        
		getAggregatedTimeStat.get(function(err, row) {
            getAggregatedTimeStat.finalize();
            db.close();
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
		});
    },
    
    create: function(timeSheet, cb) {
        
        if(logger.isDebugEnabled()) logger.debug('insert timeSheet with object: ' + util.inspect(timeSheet));

        dbUtil.performInsert(timeSheet, 'TIME_SHEET', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = timeSheets_db;
