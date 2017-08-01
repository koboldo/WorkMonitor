var sqlite3 = require('sqlite3');
var util = require('util');
var db = new sqlite3.Database('./work-monitor.db');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 

var queries = {
	getWorkTypes: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, PRICE FROM WORK_TYPE',
	getWorkType: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, PRICE FROM WORK_TYPE WHERE ID = ?',
};

var workTypes_db = {
       
    readAll: function(cb) {
        var getWorkTypesStat = db.prepare(queries.getWorkTypes);
        getWorkTypesStat.all(function(err,rows) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,rows)
        });;
    },
    
    read: function(workTypeId, cb) {
        //TODO: parameter validation
        var getWorkTypeStat = db.prepare(queries.getWorkType);
		getWorkTypeStat.bind(workTypeId).get(function(err, row) {
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
            
		});
    },
    
    update: function(workTypeId, workType, cb) {
        dbUtil.performUpdate(workTypeId, workType, 'WORK_TYPE', function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        });
    },
    
    create: function(workType, cb) {
        dbUtil.performInsert(workType, 'WORK_TYPE', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

function logErrAndCall(err,cb) {
	logger.error(err.message);
	cb(err.message);
}

module.exports = workTypes_db;
