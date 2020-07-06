/* jshint node: true, esversion: 6 */
'use strict';

const async = require('async');
const util = require('util');
const dbUtil = require('./db_util');
const logger = require('../logger').logger; 
const logErrAndCall = require('../local_util').logErrAndCall;
const addCtx = require('../logger').addCtx;

const queries = {
	getPersons: 'SELECT ID, EXCEL_ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE, RANK_CODE, IS_ACTIVE, IS_EMPLOYED, PROJECT_FACTOR, IS_FROM_POOL, COMPANY, AGREEMENT_CODE, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST, SALARY, SALARY_RATE, LEAVE_RATE, MODIFIED_BY, DATETIME(CREATED ,"unixepoch", "localtime") AS CREATED, DATETIME(LAST_MOD ,"unixepoch", "localtime") AS LAST_MOD FROM PERSON ORDER BY LAST_NAME, FIRST_NAME, MODIFIED_BY ASC',
	getPerson: 'SELECT ID, EXCEL_ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE, RANK_CODE, IS_ACTIVE, IS_EMPLOYED, PROJECT_FACTOR, IS_FROM_POOL, COMPANY, AGREEMENT_CODE, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST, SALARY, SALARY_RATE, LEAVE_RATE, MODIFIED_BY, DATETIME(CREATED ,"unixepoch", "localtime") AS CREATED, DATETIME(LAST_MOD ,"unixepoch", "localtime") AS LAST_MOD FROM PERSON WHERE ID = ?',
	getPersonHistory: 'SELECT ID, EXCEL_ID, EMAIL, LAST_NAME, FIRST_NAME, OFFICE_CODE, ROLE_CODE, RANK_CODE, IS_ACTIVE, IS_EMPLOYED, PROJECT_FACTOR, IS_FROM_POOL, COMPANY, AGREEMENT_CODE, ACCOUNT, PHONE, POSITION, ADDRESS_STREET, ADDRESS_POST, SALARY, SALARY_RATE, LEAVE_RATE, DATETIME(HIST_CREATED ,"unixepoch", "localtime") AS HIST_CREATED, DATETIME(CREATED ,"unixepoch", "localtime") AS CREATED, DATETIME(LAST_MOD ,"unixepoch", "localtime") AS LAST_MOD, MODIFIED_BY, IS_DELETED FROM PERSON_HIST WHERE ID = ?',
	getMaxPersonId: 'SELECT MAX(ID) AS MAX_ID FROM PERSON',
	getPersonOrderIds: 'SELECT WO.ID FROM WORK_ORDER WO, PERSON_WO PW WHERE PW.PERSON_ID = ? AND PW.WO_ID = WO.ID AND WO.STATUS_CODE = "AS"',
	getPersonOrderStats:
	`WITH PARAMS AS (
		SELECT CAST (STRFTIME('%%s', '%(dateAfter)s', 'start of day') AS INTEGER) AS AFTER_DATE,
			   CAST (STRFTIME('%%s', '%(dateBefore)s', 'start of day', '+1 day', '-1 second') AS INTEGER) AS BEFORE_DATE
	),
	SELECTED_WO AS (
		SELECT ID, CASE MAX(DATE_TYPE) WHEN 2 THEN DATETIME(MAX(WO_DATE), "unixepoch", "localtime") ELSE NULL END AS DONE_DATE
		FROM (
			SELECT WO.ID, WO.LAST_MOD WO_DATE, 2 DATE_TYPE
			FROM WORK_ORDER WO
			WHERE STATUS_CODE = 'CO'
			UNION ALL
			SELECT WOH.ID, WOH.LAST_MOD WO_DATE, 2 DATE_TYPE
			FROM WORK_ORDER_HIST WOH
			WHERE STATUS_CODE = 'CO'
			UNION ALL
			SELECT WO.ID, PWO.CREATED WO_DATE, 1 DATE_TYPE
			FROM WORK_ORDER WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID
			WHERE STATUS_CODE = 'AS'
		) 
		JOIN PARAMS P
		GROUP BY ID
		HAVING MAX(WO_DATE) BETWEEN P.AFTER_DATE AND P.BEFORE_DATE
	)
	SELECT WO.ID WO_ID,
		   WO.WORK_NO WO_WORK_NO,
		   SW.DONE_DATE WO_DONE_DATE,
		   DATETIME(PWO.CREATED, "unixepoch", "localtime") AS WO_ASSIGNED_DATE,
		   WO.STATUS_CODE WO_STATUS_CODE,
		   WO.TYPE_CODE WO_TYPE_CODE,
		   WO.COMPLEXITY WO_COMPLEXITY,
		   WO.COMPLEXITY_CODE WO_COMPLEXITY_CODE,
		   WO.PRICE WO_PRICE,
		   PWO.PERSON_ID,
		   P.EMAIL AS PERSON_EMAIL,
		   P.FIRST_NAME AS PERSON_FIRST_NAME,
		   P.LAST_NAME AS PERSON_LAST_NAME,
		   P.OFFICE_CODE AS PERSON_OFFICE_CODE,
		   P.ROLE_CODE AS PERSON_ROLE_CODE,
		   P.IS_FROM_POOL AS PERSON_IS_FROM_POOL
	  FROM WORK_ORDER AS WO JOIN PERSON_WO AS PWO ON WO.ID = PWO.WO_ID
			JOIN PARAMS PA JOIN PERSON AS P ON PWO.PERSON_ID = P.ID 
			JOIN SELECTED_WO SW ON SW.ID = PWO.WO_ID`,
	getIsFromPool: 'SELECT CASE WHEN ( P.IS_FROM_POOL == "Y" OR ( "DETACHED" <> ? AND ( SELECT CASE WHEN COUNT(1) > 0 THEN "Y" ELSE "N" END IS_FROM_POOL FROM PERSON P1 ,PERSON_WO PW1 WHERE P1.ID = PW1.PERSON_ID AND PW1.WO_ID = WO.ID AND P1.IS_FROM_POOL = "Y" ) == "Y" ) ) AND WT.IS_FROM_POOL == "Y" THEN "Y" ELSE "N" END IS_FROM_POOL FROM PERSON P ,WORK_TYPE WT ,WORK_ORDER WO WHERE WO.ID = ? AND P.ID = ? AND WT.OFFICE_CODE = WO.OFFICE_CODE AND WT.TYPE_CODE = WO.TYPE_CODE AND WT.COMPLEXITY_CODE = WO.COMPLEXITY_CODE',
	savePersonIsFromPoolToTemp: 'CREATE TEMP TABLE PERSON_TMP AS SELECT ID, IS_FROM_POOL FROM PERSON WHERE ID = %(personId)s',
	updatePersonOrders:
	`WITH WO_SET AS (
		SELECT WO.ID, P.IS_FROM_POOL
		FROM
			PERSON P 
			JOIN PERSON_TMP PT ON P.ID = PT.ID
			JOIN PERSON_WO PW ON PW.PERSON_ID = P.ID
			JOIN WORK_ORDER WO ON WO.ID = PW.WO_ID 				 
			JOIN WORK_TYPE WT ON WT.OFFICE_CODE = WO.OFFICE_CODE AND WT.TYPE_CODE = WO.TYPE_CODE AND WT.COMPLEXITY_CODE = WO.COMPLEXITY_CODE
			LEFT JOIN  WORK_ORDER_HIST WOH ON WOH.ID = WO.ID
		WHERE WT.IS_FROM_POOL = "Y"
		AND WO.IS_FROM_POOL <> P.IS_FROM_POOL
		AND (WO.STATUS_CODE IN ('OP','AS') OR (WO.STATUS_CODE = 'CO' AND WO.LAST_MOD > P.LAST_MOD) OR (WOH.STATUS_CODE IN ('CO') AND WOH.LAST_MOD > P.LAST_MOD))
		AND NOT EXISTS (
			SELECT 1
			FROM PERSON_WO PW1 JOIN PERSON P1 ON PW1.PERSON_ID = P1.ID
			WHERE PW1.WO_ID = WO.ID
				AND PW1.PERSON_ID <> P.ID
				AND PW1.PERSON_ID = P1.ID
				AND P1.IS_FROM_POOL = "Y"
		)
	)
	UPDATE WORK_ORDER
	SET IS_FROM_POOL = ( SELECT IS_FROM_POOL FROM WO_SET WHERE WO_SET.ID = WORK_ORDER.ID )
	WHERE ID IN ( SELECT ID FROM WO_SET )`,
	updatePersonOrderIsFromPool:
	// `WITH CALCULATION AS (
	// 	SELECT WO.ID, CASE WHEN ( P.IS_FROM_POOL == "Y" OR ( "DETACHED" <> "%(detachMode)s" AND ( SELECT CASE WHEN COUNT(1) > 0 THEN "Y" ELSE "N" END IS_FROM_POOL FROM PERSON P1 ,PERSON_WO PW1 WHERE P1.ID = PW1.PERSON_ID AND PW1.WO_ID = WO.ID AND P1.IS_FROM_POOL = "Y" ) == "Y" ) ) AND WT.IS_FROM_POOL == "Y" THEN "Y" ELSE "N" END IS_FROM_POOL
	// 	FROM PERSON P, WORK_TYPE WT, WORK_ORDER WO 
	// 	WHERE WO.ID = %(workOrderId)s 
	// 	AND P.ID = %(personId)s 
	// 	AND WT.OFFICE_CODE = WO.OFFICE_CODE
	// 	AND WT.TYPE_CODE = WO.TYPE_CODE
	// 	AND WT.COMPLEXITY_CODE = WO.COMPLEXITY_CODE
	// )
	// UPDATE WORK_ORDER
	// SET IS_FROM_POOL = ( SELECT IS_FROM_POOL FROM CALCULATION )
	// WHERE ID IN ( SELECT ID FROM CALCULATION )`,
	`WITH INIT AS (
		SELECT WO.ID WO_ID, COUNT(P.ID) ALL_PERSONS, SUM(CASE P.IS_FROM_POOL WHEN "Y" THEN 1 ELSE 0 END) POOL_PERSONS 
		FROM WORK_ORDER WO LEFT JOIN PERSON_WO PW ON WO.ID = PW.WO_ID
		LEFT JOIN PERSON P ON P.ID = PW.PERSON_ID WHERE WO.ID = %(workOrderId)s
	),
	CALCULATION AS (
		SELECT WO.ID, 
		CASE WHEN WT.IS_FROM_POOL == "N" THEN "N"
			WHEN I.POOL_PERSONS > 0 THEN "Y"
			WHEN I.ALL_PERSONS > 0 THEN "N"
			ELSE "Y" 
		END IS_FROM_POOL
		FROM WORK_ORDER WO 
		JOIN WORK_TYPE WT ON WT.OFFICE_CODE = WO.OFFICE_CODE AND WT.TYPE_CODE = WO.TYPE_CODE AND WT.COMPLEXITY_CODE = WO.COMPLEXITY_CODE
		JOIN INIT I
		WHERE WO.ID = I.WO_ID    
	)
	UPDATE WORK_ORDER
	SET IS_FROM_POOL = ( SELECT IS_FROM_POOL FROM CALCULATION )
	WHERE ID IN ( SELECT ID FROM CALCULATION )`,
	updatePersonLastModAndHistory:
	`UPDATE PERSON SET LAST_MOD = %(effectiveDate)s WHERE ID = %(personId)s;
	UPDATE PERSON_HIST SET IS_DELETED = "Y" WHERE ID = %(personId)s AND LAST_MOD >= %(effectiveDate)s`
};

const filters = {
    getPersonOrdersReport: {
        dateAfter: '%(dateAfter)s',
        dateBefore: '%(dateBefore)s'
	},
	savePersonIsFromPoolToTemp:{
		personId: '%(personId)s'
	},
	updatePersonOrderIsFromPool: {
		// detachMode: '%(detachMode)s',
		// personId: '%(personId)s',
		workOrderId: '%(workOrderId)s'
	},
	updatePersonLastModAndHistory: {
		personId: '%(personId)s',
		effectiveDate: 'STRFTIME("%%s", "%(effectiveDate)s", "start of month")'
	}
};

const persons_db = {
	
	readOrders: function(params,cb){
		const db = dbUtil.getDatabase();
		const query = dbUtil.prepareFiltersByInsertion(queries.getPersonOrderStats,params,filters.getPersonOrdersReport);
		const getPersonOrdersReportStat = db.prepare(query);
		getPersonOrdersReportStat.all(addCtx(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			let persons = transformReportRows(rows);
			cb(null,persons);
		}));
	},

	readAll: function(cb) {
		const db = dbUtil.getDatabase();
		const getPersonsStat = db.prepare(queries.getPersons);
		getPersonsStat.all(addCtx(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			const calls = [];
			
			rows.forEach(function(row){

				if(row.ROLE_CODE) row.ROLE_CODE = row.ROLE_CODE.split(',');

				calls.push(addCtx(function(async_cb) {

					const getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds);
					getPersonOrderIdsStat.bind(row.ID).all(addCtx(function(err,idRows){
						getPersonOrderIdsStat.finalize();

						const ids = [];
						idRows.forEach((idRow) => { ids.push(idRow.ID); });
						row.WORK_ORDERS = ids;
						async_cb();
					}));
				}));
			});
			
			async.parallelLimit(calls, 5, addCtx(function(err, result) {
                    getPersonsStat.finalize();
                    db.close();
					if (err) {
                        logErrAndCall(err,cb);
					} else {
						cb(null,rows);
					}
				}));
		}));
	},

	read: function(personId, cb) {
		const db = dbUtil.getDatabase();
				
		// TODO: validation in middleware
        const getPersonStat = db.prepare(queries.getPerson);
		getPersonStat.bind(personId).get(addCtx(function(err, row) {
			getPersonStat.finalize();
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}

			if(row.ROLE_CODE) row.ROLE_CODE = row.ROLE_CODE.split(',');

			const getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds);
			getPersonOrderIdsStat.bind(row.ID).all(addCtx(function(err,idRows){
				getPersonOrderIdsStat.finalize();
				
				const ids = [];
				idRows.forEach((idRow) => { ids.push(idRow.ID); });
				row.WORK_ORDERS = ids;
				cb(null,row);
			}));
		}));
	},
	
	update: function(personId, person, effectiveDate, cb) {

		const db = dbUtil.getDatabase();

		const sqls = [];

		sqls.push(dbUtil.prepareFiltersByInsertion(queries.savePersonIsFromPoolToTemp,{ personId: personId },filters.savePersonIsFromPoolToTemp));
		sqls.push(dbUtil.prepareUpdate({ ID: personId },person,'PERSON'));

		if(effectiveDate) {
			const params = {
				personId: personId,
				effectiveDate: effectiveDate
			}
			sqls.push(dbUtil.prepareFiltersByInsertion(queries.updatePersonLastModAndHistory,params,filters.updatePersonLastModAndHistory));
		}
		
		sqls.push(queries.updatePersonOrders);

		logger().info('SQL\n' + sqls.join(';'));

		db.exec(sqls.join(';'),function(err){
			db.close();

			if(err)  logErrAndCall(err,cb);
			else cb(null,1);
		});
	},
	
	create: function(person, cb) {
        
		if(person.ROLE_CODE) person.ROLE_CODE = [].concat(person.ROLE_CODE).join(',');
		
		if(logger().isDebugEnabled()) logger().debug('insert person with object: ' + util.inspect(person));
        
        dbUtil.performInsert(person, 'PERSON', null, addCtx(function(err, newId){
            if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        }));
	},

	addOrder: function(orderRelation, detachExistingRelation, cb) {
		if(logger().isDebugEnabled()) logger().debug('insert relation : ' +  util.inspect(orderRelation));
	
		const db = dbUtil.getDatabase();

		const sqls = [];

		// sqls.push('BEGIN');
		if(detachExistingRelation == true) {
			const obj = {};
			obj.WO_ID = orderRelation.WO_ID;
			sqls.push(dbUtil.prepareDelete(obj,'PERSON_WO'));
		}
		sqls.push(dbUtil.prepareInsert(orderRelation,'PERSON_WO'));

		const params = {
			// detachMode:  (detachExistingRelation) ? 'DETACHED': 'NOT_DETACHED',
			// personId: orderRelation.PERSON_ID,
			workOrderId: orderRelation.WO_ID
		};

		sqls.push(dbUtil.prepareFiltersByInsertion(queries.updatePersonOrderIsFromPool,params,filters.updatePersonOrderIsFromPool));
		// sqls.push('COMMIT');

		db.exec(sqls.join(';'),function(err){
			if(err)  logErrAndCall(err,cb);
			else cb(null,1);

			db.close();
		});
	},
	
	deleteOrder: function(orderRelation, cb) {
		if(logger().isDebugEnabled()) logger().debug('delete relation : ' +  util.inspect(orderRelation));

		const db = dbUtil.getDatabase();

		const sqls = [];
		sqls.push(dbUtil.prepareDelete(orderRelation,'PERSON_WO'));
		sqls.push(dbUtil.prepareFiltersByInsertion(queries.updatePersonOrderIsFromPool,{workOrderId: orderRelation.WO_ID},filters.updatePersonOrderIsFromPool));
		logger().debug(sqls.join(';'));

		db.exec(sqls.join(';'),function(err){
			if(err)  logErrAndCall(err,cb);
			else cb(null,1);

			db.close();
		});

		// dbUtil.performDelete(orderRelation,'PERSON_WO',addCtx(function(err,newId){
		// 	if(err) return logErrAndCall(err,cb);
        //     cb(null,newId);
		// }));
	},
	
	readHistory: function(personId, cb) {
		const db = dbUtil.getDatabase();
		const getPersonStat = db.prepare(queries.getPersonHistory);
		getPersonStat.bind(personId).all(addCtx(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			const calls = [];
			
			rows.forEach(function(row){

				if(row.ROLE_CODE) row.ROLE_CODE = row.ROLE_CODE.split(',');

				calls.push(function(async_cb) {

					const getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds);
					getPersonOrderIdsStat.bind(row.ID).all(addCtx(function(err,idRows){
						getPersonOrderIdsStat.finalize();

						const ids = [];
						idRows.forEach((idRow) => { ids.push(idRow.ID); });
						row.WORK_ORDERS = ids;
						async_cb();
					}));
				});
			});
			
			async.parallelLimit(calls, 5, addCtx(function(err, result) {
                    getPersonStat.finalize();
                    db.close();
					if (err) {
                        logErrAndCall(err,cb);
					} else {
						cb(null,rows);
					}
				}));
		}));
	}
};

function transformReportRows(rows) {
	const personsMap = {};
	rows.forEach((row)=>{
		const pid = row.PERSON_ID;
		const personTransformed = (personsMap[pid]) ? true : false;

		const person = {};
		const order = {};
		for(const field in row) {
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
	const persons = [];
	for(let id in personsMap) persons.push(personsMap[id]);
	return persons;
}

module.exports = persons_db;