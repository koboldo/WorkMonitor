/* jshint node: true, esversion: 6 */
'use strict';

var sqlite3 = require('sqlite3');
var async = require('async');
var util = require('util');
var dbUtil = require('./db_util');
var logger = require('../logger').getLogger('monitor');
var logErrAndCall = require('../local_util').logErrAndCall;

// var db = new sqlite3.Database('./work-monitor.db');


var queries = {
	getPersons: 'SELECT ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE, RANK_CODE, IS_ACTIVE, PROJECT_FACTOR, IS_FROM_POOL, COMPANY, AGREEMENT_CODE, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST FROM PERSON ORDER BY LAST_NAME, FIRST_NAME ASC',
	getPerson: 'SELECT ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE, RANK_CODE, IS_ACTIVE, PROJECT_FACTOR, IS_FROM_POOL, COMPANY, AGREEMENT_CODE, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST FROM PERSON WHERE ID = ?',
	getMaxPersonId: 'SELECT MAX(ID) AS MAX_ID FROM PERSON',
	getPersonOrderIds: 'SELECT WO.ID FROM WORK_ORDER WO, PERSON_WO PW WHERE PW.PERSON_ID = ? AND PW.WO_ID = WO.ID AND WO.STATUS_CODE = "AS"',
	getPersonOrderStats:
	// `WITH PARAMS AS (SELECT STRFTIME('%%s','%(dateAfter)s') AS AFTER_DATE, STRFTIME('%%s','%(dateBefore)s') AS BEFORE_DATE)
	// SELECT WOS.ID AS WO_ID, WOS.WORK_NO AS WO_WORK_NO, WOS.DONE_DATE AS WO_DONE_DATE, WOS.ASSIGNED_DATE AS WO_ASSIGNED_DATE, WOS.STATUS_CODE AS WO_STATUS_CODE, WOS.TYPE_CODE AS WO_TYPE_CODE, WOS.COMPLEXITY_CODE AS WO_COMPLEXITY_CODE,
	// P.ID AS PERSON_ID, P.EMAIL AS PERSON_EMAIL, P.FIRST_NAME AS PERSON_FIRST_NAME, P.LAST_NAME AS PERSON_LAST_NAME, P.OFFICE_CODE AS PERSON_OFFICE_CODE, P.ROLE_CODE AS PERSON_ROLE_CODE, P.PROJECT_FACTOR AS PERSON_PROJECT_FACTOR ,P.IS_POOL_INCLUDED AS PERSON_IS_POOL_INCLUDED ,P.COMPANY AS PERSON_COMPANY ,P.AGREEMENT_TYPE AS PERSON_AGREEMENT_TYPE ,P.ACCOUNT AS PERSON_ACCOUNT ,P.PHONE AS PERSON_PHONE ,P.POSITION AS PERSON_POSITION ,P.ADDRESS_STREET AS PERSON_ADDRESS_STREET ,P.ADDRESS_POST AS PERSON_ADDRESS_POST
	// FROM
	// (SELECT ID, WORK_NO, CASE STATUS_CODE WHEN 'CO' THEN DATETIME(LAST_MOD,'unixepoch') ELSE null END AS DONE_DATE, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, DATETIME(PWO.CREATED,'unixepoch') AS ASSIGNED_DATE, PWO.PERSON_ID
	// FROM WORK_ORDER AS WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID 
	// WHERE (STATUS_CODE = 'CO' AND LAST_MOD/86400 BETWEEN (SELECT AFTER_DATE/86400 FROM PARAMS) AND (SELECT BEFORE_DATE/86400 FROM PARAMS))
	// 	OR (WO.STATUS_CODE IN ('AS') AND PWO.CREATED/86400 BETWEEN (SELECT AFTER_DATE/86400 FROM PARAMS) AND (SELECT BEFORE_DATE/86400 FROM PARAMS) )
	// UNION
	// SELECT ID, WORK_NO, CASE STATUS_CODE WHEN 'CO' THEN DATETIME(LAST_MOD,'unixepoch') ELSE null END AS DONE_DATE, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, DATETIME(PWO.CREATED,'unixepoch') AS ASSIGNED_DATE, PWO.PERSON_ID
	// FROM WORK_ORDER_HIST AS WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID
	// WHERE (STATUS_CODE = 'CO' AND LAST_MOD/86400 BETWEEN (SELECT AFTER_DATE/86400 FROM PARAMS) AND (SELECT BEFORE_DATE/86400 FROM PARAMS))
	// 	) AS WOS JOIN PERSON AS P WHERE WOS.PERSON_ID = P.ID`
	`WITH PARAMS AS ( SELECT STRFTIME('%%s', '%(dateAfter)s') AS AFTER_DATE ,STRFTIME('%%s', '%(dateBefore)s') AS BEFORE_DATE )
	SELECT WOS.ID AS WO_ID ,WOS.WORK_NO AS WO_WORK_NO ,WOS.DONE_DATE AS WO_DONE_DATE ,WOS.ASSIGNED_DATE AS WO_ASSIGNED_DATE ,WOS.STATUS_CODE AS WO_STATUS_CODE ,WOS.TYPE_CODE AS WO_TYPE_CODE ,WOS.COMPLEXITY_CODE AS WO_COMPLEXITY_CODE ,P.ID AS PERSON_ID ,P.EMAIL AS PERSON_EMAIL ,P.FIRST_NAME AS PERSON_FIRST_NAME ,P.LAST_NAME AS PERSON_LAST_NAME ,P.OFFICE_CODE AS PERSON_OFFICE_CODE ,P.ROLE_CODE AS PERSON_ROLE_CODE ,P.IS_FROM_POOL AS PERSON_IS_FROM_POOL
	FROM (
	SELECT ID ,WORK_NO ,CASE STATUS_CODE WHEN 'CO' THEN DATETIME ( LAST_MOD ,'unixepoch' ) ELSE NULL END AS DONE_DATE ,STATUS_CODE ,TYPE_CODE ,COMPLEXITY_CODE ,DATETIME ( PWO.CREATED ,'unixepoch' ) AS ASSIGNED_DATE ,PWO.PERSON_ID FROM WORK_ORDER AS WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID WHERE ( STATUS_CODE = 'CO' AND LAST_MOD / 86400 BETWEEN ( SELECT AFTER_DATE / 86400 FROM PARAMS ) AND ( SELECT BEFORE_DATE / 86400 FROM PARAMS ) ) OR ( WO.STATUS_CODE IN ('AS') AND PWO.CREATED / 86400 BETWEEN ( SELECT AFTER_DATE / 86400 FROM PARAMS ) AND ( SELECT BEFORE_DATE / 86400 FROM PARAMS ) )
	UNION
	SELECT ID ,WORK_NO ,CASE STATUS_CODE WHEN 'CO' THEN DATETIME ( LAST_MOD ,'unixepoch' ) ELSE NULL END AS DONE_DATE ,STATUS_CODE ,TYPE_CODE ,COMPLEXITY_CODE ,DATETIME ( PWO.CREATED ,'unixepoch' ) AS ASSIGNED_DATE ,PWO.PERSON_ID FROM WORK_ORDER_HIST AS WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID WHERE ( STATUS_CODE = 'CO' AND LAST_MOD / 86400 BETWEEN ( SELECT AFTER_DATE / 86400 FROM PARAMS ) AND ( SELECT BEFORE_DATE / 86400 FROM PARAMS ) )
	) AS WOS
	JOIN PERSON AS P WHERE WOS.PERSON_ID = P.ID`
};

// ??
var filters = {
    getPersonOrdersReport: {
        dateAfter: '%(dateAfter)s',
        dateBefore: '%(dateBefore)s'
    }
};

var persons_db = {
	
	readOrders: function(params,cb){
		var db = dbUtil.getDatabase();
		var query = dbUtil.prepareFiltersByInsertion(queries.getPersonOrderStats,params,filters.getPersonOrdersReport);
		var getPersonOrdersReportStat = db.prepare(query);
		getPersonOrdersReportStat.all(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			let persons = transformReportRows(rows);
			cb(null,persons);
		});
	},

	readAll: function(cb) {
		var db = dbUtil.getDatabase();
		var getPersonsStat = db.prepare(queries.getPersons);
		getPersonsStat.all(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			var calls = [];
			
			rows.forEach(function(row){

				if(row.ROLE_CODE) row.ROLE_CODE = row.ROLE_CODE.split(',');

				calls.push(function(async_cb) {

					var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds);
					getPersonOrderIdsStat.bind(row.ID).all(function(err,idRows){
						getPersonOrderIdsStat.finalize();

						var ids = [];
						idRows.forEach((idRow) => { ids.push(idRow.ID) });
						row.WORK_ORDERS = ids;
						async_cb();
					});
					// getRowsIds: function(statement, rowId, cb) {
					// 	statement.bind(rowId).all(function(err,rows){
					// 		var ids = [];
					// 		rows.forEach(function(row){
					// 			ids.push(row.ID);
					// 		});
					// 		cb(ids);
					// 	});
					// }


                    // dbUtil.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
					// 	row.WORK_ORDERS = ids;
                    //     getPersonOrderIdsStat.finalize();
					// 	async_cb();
					// });
				});
			});
			
			async.parallelLimit(calls, 5, function(err, result) {
                    getPersonsStat.finalize();
                    db.close();
					if (err) {
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
			getPersonStat.finalize();
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}

			if(row.ROLE_CODE) row.ROLE_CODE = row.ROLE_CODE.split(',');

			var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds);
			getPersonOrderIdsStat.bind(row.ID).all(function(err,idRows){
				getPersonOrderIdsStat.finalize();
				
				var ids = [];
				idRows.forEach((idRow) => { ids.push(idRow.ID) });
				row.WORK_ORDERS = ids;
				cb(null,row);
			});
			// dbUtil.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
			// 	row.WORK_ORDERS = ids;
            //     getPersonOrderIdsStat.finalize();
            //     getPersonStat.finalize();
            //     db.close();
			// 	cb(null,row);
			// });
		});
	},
	
	update: function(personId, person, cb) {
        var idObj = {};
        // idObj.name = 'ID';
		// idObj.value = personId;
		idObj.ID = personId;
		
		if(person.ROLE_CODE) person.ROLE_CODE = [].concat(person.ROLE_CODE).join(',');
        
        if(logger.isDebugEnabled()) logger.debug('update person of id ' + personId + ' with object: ' + util.inspect(person));
        
        dbUtil.performUpdate(idObj, person, 'PERSON', function(err,result) {
            if(err) return logErrAndCall(err,cb);
            cb(null,result);
        });
	},
	
	create: function(person, cb) {
        
		if(person.ROLE_CODE) person.ROLE_CODE = [].concat(person.ROLE_CODE).join(',');
		
		if(logger.isDebugEnabled()) logger.debug('insert person with object: ' + util.inspect(person));
        
        dbUtil.performInsert(person, 'PERSON', null, function(err, newId){
            if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        });
	},

	addOrder: function(orderRelation, detachExistingRelation, cb) {
		if(logger.isDebugEnabled()) logger.debug('insert relation : ' +  util.inspect(orderRelation));
		
		var mydb = dbUtil.getDatabase();

		var newRelationId;
		async.series([
			function(_cb) {
				dbUtil.startTx(mydb,function(err, result){
					if(err) _cb(err);
					else _cb(null,result);
				});
			},

			function(_cb) {
				if(detachExistingRelation == true) {
					var obj = {};
					obj.WO_ID = orderRelation.WO_ID;
					dbUtil.performDelete(obj,'PERSON_WO',function(err,result){
						if(err) _cb(err);
						_cb(null,result);						
					}, mydb);
				} else {
					_cb(null,true);
				}
			},

			function(_cb) {
				dbUtil.performInsert(orderRelation,'PERSON_WO',null,function(err,newId){
					if(err) _cb(err);
					newRelationId = newId;
				    _cb(null,newId);
				}, mydb);				
			}],

			function(err, results) {
				if(err) {
					dbUtil.rollbackTx(mydb);
					return logErrAndCall(err,cb);
				} else {
					dbUtil.commitTx(mydb);
					cb(null,newRelationId);
				}
		});

		// dbUtil.performInsert(orderRelation,'PERSON_WO',null,function(err,newId){
		// 	if(err) return logErrAndCall(err,cb);
        //     cb(null,newId);
		// });
	},
	
	deleteOrder: function(orderRelation, cb) {
		if(logger.isDebugEnabled()) logger.debug('delete relation : ' +  util.inspect(orderRelation));

		dbUtil.performDelete(orderRelation,'PERSON_WO',function(err,newId){
			if(err) return logErrAndCall(err,cb);
            cb(null,newId);
		});
	}
};

function transformReportRows(rows) {
	let personsMap = {};
	rows.forEach((row)=>{
		let pid = row.PERSON_ID;
		let personTransformed = (personsMap[pid]) ? true : false;

		let person = {};
		let order = {};
		for(var field in row) {
			if(!personTransformed && field.startsWith('PERSON_')) {
				let newField = field.slice(7);
				person[newField] = row[field];
			}
			if(field.startsWith('WO_')) {
				let newField = field.slice(3);
				order[newField] = row[field];
			}
		}
		person.WORK_ORDERS = [];
		if(!personTransformed) {
			personsMap[pid] = person;
		}
		personsMap[pid].WORK_ORDERS.push(order);
	});
	let persons = [];
	for(let id in personsMap) persons.push(personsMap[id]);
	return persons;
}

module.exports = persons_db;