var sqlite3 = require('sqlite3');
var async = require('async');
var util = require('util');
var dbUtil = require('./db_util');
var logger = require('../logger').getLogger('monitor'); 

var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getPersons: 'SELECT ID, LAST_NAME, FIRST_NAME, OFFICE_CODE, GRADE_CODE FROM PERSON',
	getPerson: 'SELECT ID, LAST_NAME, FIRST_NAME, OFFICE_CODE, GRADE_CODE FROM PERSON WHERE ID = ?',
	getMaxPersonId: 'SELECT MAX(ID) AS MAX_ID FROM PERSON',
	getPersonOrderIds: 'SELECT WO.ID FROM WORK_ORDER WO, PERSON_WO PW WHERE PW.PERSON_ID = ? AND PW.WO_ID = WO.ID'
};

var tools = {
	getRowsIds: function(statement, rowId, cb) {
		statement.bind(rowId).all(function(err,rows){
			var ids = [];
			rows.forEach(function(row){
				ids.push(row.ID);
			});
			cb(ids);
		});
	},
    
    // prepareInsert: function(personId, person) {
        // var sqlCols = 'ID';
        // var sqlVals = '' + personId;
        // for(var col in person) {
            // sqlCols += ', ' + col;
            // sqlVals += ', "' + person[col] + '"';
        // }

        // return 'INSERT INTO PERSON (' + sqlCols + ') VALUES (' + sqlVals + ')';
    // }
};

var persons_db = {
	
	readAll: function(cb) {
		
		var getPersonsStat = db.prepare(queries.getPersons);
		getPersonsStat.all(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			var calls = [];
			var persons = {list: []};
			
            var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			rows.forEach(function(row){
				calls.push(function(async_cb) {

                    tools.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
						row.WORK_ORDERS = ids;
						async_cb();
					});
				});
			});
			
			async.parallelLimit(calls, 5, function(err, result) {
					if (err) {
						// logger.info(err);
						// cb(err);
                        logErrAndCall(err,cb);
					} else {
						cb(null,rows);
					}
				});
		});
	},

	read: function(personId, cb) {
		// logger.info('person read db with id : ' + personId);
				
		// TODO: validation in middleware
        var getPersonStat = db.prepare(queries.getPerson);
		getPersonStat.bind(personId).get(function(err, row) {
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            
			var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			tools.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
				row.WORK_ORDERS = ids;
				cb(null,row);
			});
		});
	},
	
	update: function(personId, person, cb) {
        dbUtil.performUpdate(personId, person, 'PERSON', function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        });
	},
	
	create: function(person, cb) {
        dbUtil.performInsert(person, 'PERSON', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
	} 
};

function logErrAndCall(err,cb) {
	// console.log(err.message);
	logger.error(err.message);
	cb(err.message);
}

module.exports = persons_db;