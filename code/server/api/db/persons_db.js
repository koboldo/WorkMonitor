'use strict';

var sqlite3 = require('sqlite3');
var async = require('async');
var util = require('util');
var dbUtil = require('./db_util');
var logger = require('../logger').getLogger('monitor');
var logErrAndCall = require('../local_util').logErrAndCall;

// var db = new sqlite3.Database('./work-monitor.db');


var queries = {
	getPersons: 'SELECT ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE FROM PERSON',
	getPerson: 'SELECT ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE FROM PERSON WHERE ID = ?',
	getMaxPersonId: 'SELECT MAX(ID) AS MAX_ID FROM PERSON',
	getPersonOrderIds: 'SELECT WO.ID FROM WORK_ORDER WO, PERSON_WO PW WHERE PW.PERSON_ID = ? AND PW.WO_ID = WO.ID'
};

var persons_db = {
	
	readAll: function(cb) {
		var db = dbUtil.getDatabase();
		var getPersonsStat = db.prepare(queries.getPersons);
		getPersonsStat.all(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			var calls = [];
			var persons = {list: []};
			
			rows.forEach(function(row){
				calls.push(function(async_cb) {

                    var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
                    dbUtil.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
						row.WORK_ORDERS = ids;
                        getPersonOrderIdsStat.finalize();
						async_cb();
					});
				});
			});
			
			async.parallelLimit(calls, 5, function(err, result) {
                    getPersonsStat.finalize();
                    db.close();
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
		var db = dbUtil.getDatabase();
				
		// TODO: validation in middleware
        var getPersonStat = db.prepare(queries.getPerson);
		getPersonStat.bind(personId).get(function(err, row) {
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
                getPersonStat.finalize();
				cb(null,null);
				return;
			}
            
			var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			dbUtil.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
				row.WORK_ORDERS = ids;
                getPersonOrderIdsStat.finalize();
                getPersonStat.finalize();
                db.close();
				cb(null,row);
			});
		});
	},
	
	update: function(personId, person, cb) {
        var idObj = {};
        idObj.name = 'ID';
        idObj.value = personId;
        
        if(logger.isDebugEnabled()) logger.debug('update person of id ' + personId + ' with object: ' + util.inspect(person));
        
        dbUtil.performUpdate(idObj, person, 'PERSON', function(err,result) {
            if(err) return logErrAndCall(err,cb);
            cb(null,result);
        });
	},
	
	create: function(person, cb) {
        
        if(logger.isDebugEnabled()) logger.debug('insert person with object: ' + util.inspect(person));
        
        dbUtil.performInsert(person, 'PERSON', null, function(err, newId){
            if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        });
	},

	addOrder: function(orderRelation, cb) {
		if(logger.isDebugEnabled()) logger.debug('insert relation : ' +  util.inspect(orderRelation));
		
		dbUtil.performInsert(orderRelation,'PERSON_WO',null,function(err,newId){
			if(err) return logErrAndCall(err,cb);
            cb(null,newId);
		});
	},
	
	deleteOrder: function(orderRelation, cb) {
		if(logger.isDebugEnabled()) logger.debug('delete relation : ' +  util.inspect(orderRelation));

		dbUtil.performDelete(orderRelation,'PERSON_WO',function(err,newId){
			if(err) return logErrAndCall(err,cb);
            cb(null,newId);
		});
	}
};

module.exports = persons_db;