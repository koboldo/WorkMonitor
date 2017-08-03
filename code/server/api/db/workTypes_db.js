var sqlite3 = require('sqlite3');
var util = require('util');
// var db = new sqlite3.Database('./work-monitor.db');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 
var logErrAndCall = require('../local_util').logErrAndCall;


var queries = {
	getWorkTypes: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, PRICE FROM WORK_TYPE',
	getWorkType: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, PRICE FROM WORK_TYPE WHERE ID = ?',
};

var workTypes_db = {
       
    readAll: function(cb) {
        var db = dbUtil.getDatabase();
        var getWorkTypesStat = db.prepare(queries.getWorkTypes);
        getWorkTypesStat.all(function(err,rows) {
            getWorkTypesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows)
        });
    },
    
    read: function(workTypeId, cb) {
        //TODO: parameter validation
        var db = dbUtil.getDatabase();
        var getWorkTypeStat = db.prepare(queries.getWorkType);
		getWorkTypeStat.bind(workTypeId).get(function(err, row) {
            getWorkTypeStat.finalize();
            db.close();
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
            
		});
    },
    
    update: function(workTypeId, workType, cb) {
        var idObj = {};
        idObj.name = 'ID';
        idObj.value = workTypeId;
        
        dbUtil.performUpdate(idObj, workType, 'WORK_TYPE', function(err,result) {
            if(err) return logErrAndCall(err,cb);
            cb(null,result);
        });
    },
    
    create: function(workType, cb) {
        dbUtil.performInsert(workType, 'WORK_TYPE', null, function(err, newId){
            if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = workTypes_db;
