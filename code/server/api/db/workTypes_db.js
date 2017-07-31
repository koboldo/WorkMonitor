var sqlite3 = require('sqlite3');
var util = require('util');
var logger = require('../../logger').getLogger('monitor'); 
var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getWorkType: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, PRICE FROM WORK_TYPE WHERE ID = ?',
};

var workTypes_db = {
       
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
    
    update: function(workTypeId, cb) {},
    
    create: function(workTypeId, cb) {}
};

function logErrAndCall(err,cb) {
	logger.error(err.message);
	cb(err.message);
}

module.exports = workTypes_db;
