/* jshint node: true, esversion: 6 */
'use strict';

const util = require('util');
const dbUtil = require('./db_util');
const async = require('async');
const sprintf = require("sprintf-js").sprintf;
const logErrAndCall = require('../local_util').logErrAndCall;
// var logger = require('../logger').getLogger('monitor'); 
const logger = require('../logger').logger; 
const addCtx = require('../logger').addCtx;

const queries = {
	getOrders: 'SELECT WO.ID ,WO.WORK_NO ,WO.STATUS_CODE ,WO.TYPE_CODE ,WO.COMPLEXITY_CODE ,WO.COMPLEXITY ,WO.DESCRIPTION ,WO.COMMENT ,WO.MD_CAPEX ,WO.PROTOCOL_NO ,WO.PRICE ,DATETIME ( WO.LAST_MOD ,"unixepoch", "localtime" ) AS LAST_MOD ,DATETIME ( WO.CREATED ,"unixepoch", "localtime" ) AS CREATED ,(P.FIRST_NAME || " " || P.LAST_NAME) MODIFIED_BY,WO.IS_FROM_POOL ,WO.OFFICE_CODE,WO.ITEM_ID ,( SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P ,PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID ) AS ASSIGNEE ,WO.VENTURE_ID FROM WORK_ORDER AS WO LEFT JOIN PERSON P ON WO.MODIFIED_BY = P.ID %s ORDER BY WO.LAST_MOD DESC',
	getOrder: 'SELECT WO.ID ,WO.WORK_NO ,WO.STATUS_CODE ,WO.TYPE_CODE ,WO.COMPLEXITY_CODE ,WO.COMPLEXITY ,WO.DESCRIPTION ,WO.COMMENT ,WO.MD_CAPEX ,WO.PROTOCOL_NO ,WO.PRICE ,DATETIME ( WO.LAST_MOD ,"unixepoch", "localtime" ) AS LAST_MOD ,DATETIME ( WO.CREATED ,"unixepoch", "localtime" ) AS CREATED ,(P.FIRST_NAME || " " || P.LAST_NAME) MODIFIED_BY,WO.IS_FROM_POOL ,WO.OFFICE_CODE,WO.ITEM_ID ,( SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P ,PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID ) AS ASSIGNEE ,WO.VENTURE_ID FROM WORK_ORDER AS WO LEFT JOIN PERSON P ON WO.MODIFIED_BY = P.ID WHERE WO.ID = ?',
	getOrdersByIds: 'SELECT WO.ID ,WO.WORK_NO ,WO.STATUS_CODE ,WO.TYPE_CODE ,WO.COMPLEXITY_CODE ,WO.COMPLEXITY ,WO.DESCRIPTION ,WO.COMMENT ,WO.MD_CAPEX ,WO.PROTOCOL_NO ,WO.PRICE ,DATETIME ( WO.LAST_MOD ,"unixepoch", "localtime" ) AS LAST_MOD ,DATETIME ( WO.CREATED ,"unixepoch", "localtime" ) AS CREATED ,(P.FIRST_NAME || " " || P.LAST_NAME) MODIFIED_BY,WO.IS_FROM_POOL ,WO.OFFICE_CODE,WO.ITEM_ID ,( SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P ,PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID ) AS ASSIGNEE ,WO.VENTURE_ID FROM WORK_ORDER AS WO LEFT JOIN PERSON P ON WO.MODIFIED_BY = P.ID WHERE %(idList)s ORDER BY WO.ID',
	getOrderByExtId: ' SELECT WO.ID ,WO.WORK_NO ,WO.STATUS_CODE ,WO.TYPE_CODE ,WO.COMPLEXITY_CODE ,WO.COMPLEXITY ,WO.DESCRIPTION ,WO.COMMENT ,WO.MD_CAPEX ,WO.PROTOCOL_NO ,WO.PRICE ,DATETIME ( WO.LAST_MOD ,"unixepoch", "localtime" ) AS LAST_MOD ,DATETIME ( WO.CREATED ,"unixepoch", "localtime" ) AS CREATED ,(P.FIRST_NAME || " " || P.LAST_NAME) MODIFIED_BY,WO.IS_FROM_POOL ,WO.OFFICE_CODE,WO.ITEM_ID ,( SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P ,PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID ) AS ASSIGNEE ,WO.VENTURE_ID FROM WORK_ORDER AS WO LEFT JOIN PERSON P ON WO.MODIFIED_BY = P.ID WHERE WORK_NO = ?',
    getOrderItems:   'SELECT RI.ID, RI.ITEM_NO, RI.DESCRIPTION, RI.ADDRESS, RI.MD_BUILDING_TYPE, RI.MD_CONSTRUCTION_CATEGORY, DATETIME(RI.CREATED,"unixepoch", "localtime") AS CREATED FROM RELATED_ITEM AS RI WHERE RI.ID = ?',
    calculateTotalPriceStat: `WITH PARAMS AS ( SELECT STRFTIME('%%s', '%(dateAfter)s', 'utc') AS AFTER_DATE ,STRFTIME('%%s', '%(dateBefore)s', 'utc') + 86400 AS BEFORE_DATE ) 
                                SELECT SUM(PRICE) AS TOTAL_PRICE, COUNT(WORK_NO) AS WO_COUNT FROM 
                                ( SELECT ID ,WORK_NO ,PRICE FROM WORK_ORDER WHERE ( STATUS_CODE = 'CO' AND LAST_MOD BETWEEN ( SELECT AFTER_DATE FROM PARAMS ) AND ( SELECT BEFORE_DATE FROM PARAMS ) )  
                                UNION  SELECT ID ,WORK_NO ,PRICE FROM WORK_ORDER_HIST WHERE 
                                    ( STATUS_CODE = 'CO' AND LAST_MOD BETWEEN ( SELECT AFTER_DATE FROM PARAMS ) AND ( SELECT BEFORE_DATE FROM PARAMS ) ) ) `,
    checkOrdersForProtocol: 'SELECT WORK_NO FROM WORK_ORDER WHERE ID IN (%(idList)s) AND ( PROTOCOL_NO IS NOT NULL OR STATUS_CODE != "IS" )',
    updateOrdersForProtocol: 'UPDATE WORK_ORDER SET PROTOCOL_NO = "%(protocolNo)s", STATUS_CODE = "CL" WHERE ID IN (%(idList)s)',
    // getOrdersForProtocol: `SELECT COALESCE(WO.WORK_NO,"") AS WORK_NO, COALESCE(WO.PRICE,0) AS PRICE, WO.LAST_MOD, COALESCE(WO.DESCRIPTION,"") AS DESCRIPTION, WO.PROTOCOL_NO, SUBSTR(WO.TYPE_CODE,0,INSTR(WO.TYPE_CODE,'.')) AS TYPE, RI.ITEM_NO, COALESCE(P.INITIALS,"") AS INITIALS, WO.VENTURE_ID 
    //                         FROM WORK_ORDER AS WO JOIN RELATED_ITEM AS RI ON WO.ITEM_ID = RI.ID JOIN PERSON AS P ON WO.VENTURE_ID = P.ID 
    //                         WHERE %(idList)s %(protocolNo)s`,
    getOrdersForProtocol: 
    `WITH WO_INIT AS (
        SELECT MIN(ID) ID, SUM(PRICE) PRICE
        FROM WORK_ORDER AS WO
        WHERE %(idList)s %(protocolNo)s
        GROUP BY WORK_NO
    )
    SELECT COALESCE(WO.WORK_NO, "") AS WORK_NO
        ,COALESCE(WI.PRICE, 0) AS PRICE
        ,WO.LAST_MOD
        ,COALESCE(WO.DESCRIPTION, "") AS DESCRIPTION
        ,WO.PROTOCOL_NO
        ,SUBSTR(WO.TYPE_CODE, 0, INSTR(WO.TYPE_CODE, '.')) AS TYPE
        ,RI.ITEM_NO
        ,P.FIRST_NAME || " " || P.LAST_NAME AS VENTURE
        ,WO.VENTURE_ID
    FROM WORK_ORDER AS WO
    JOIN RELATED_ITEM AS RI ON WO.ITEM_ID = RI.ID
    JOIN PERSON AS P ON WO.VENTURE_ID = P.ID
    JOIN WO_INIT WI
    WHERE WO.ID IN ( WI.ID )`,
    getOfficeCode: 'SELECT OFFICE_CODE FROM PERSON WHERE ID = ?',
    getIsFromPool: 'SELECT IS_FROM_POOL FROM WORK_TYPE WHERE TYPE_CODE = ? AND COMPLEXITY_CODE = ? AND OFFICE_CODE = ?',
    getOrderHistory: 'SELECT ID ,WORK_NO ,STATUS_CODE ,TYPE_CODE ,COMPLEXITY_CODE ,COMPLEXITY ,DESCRIPTION ,COMMENT ,MD_CAPEX ,PROTOCOL_NO ,PRICE ,DATETIME ( LAST_MOD ,"unixepoch", "localtime" ) AS LAST_MOD ,DATETIME ( CREATED ,"unixepoch", "localtime" ) AS CREATED ,DATETIME ( HIST_CREATED ,"unixepoch", "localtime" ) AS HIST_CREATED, MODIFIED_BY, ITEM_ID,VENTURE_ID FROM WORK_ORDER_HIST WHERE ID = ? ORDER BY HIST_CREATED DESC'
};

// js object used by sprintf function to prepare WHERE condition
const filters = {
    getOrders: {
        type: 'TYPE_CODE = "%(type)s"',
        status: 'STATUS_CODE = "%(status)s"',
        lastModBefore: 'WO.LAST_MOD <= STRFTIME("%%s","%(lastModBefore)s","+1 day","-1 second","utc")',
        lastModAfter: 'WO.LAST_MOD >= STRFTIME("%%s","%(lastModAfter)s","utc")',
        personId: 'WO.ID in (SELECT WO_ID FROM PERSON_WO WHERE PERSON_ID = %(personId)s)',
        firstCoBefore: 'WO.ID IN (SELECT Q.ID FROM ( SELECT WO.ID, WO.LAST_MOD FROM WORK_ORDER WO WHERE STATUS_CODE = "CO" UNION ALL SELECT WOH.ID, WOH.LAST_MOD FROM WORK_ORDER_HIST WOH WHERE STATUS_CODE = "CO" ) Q GROUP BY Q.ID HAVING MIN(Q.LAST_MOD) <= CAST(STRFTIME("%%s","%(firstCoBefore)s","utc","+1 day","-1 second") AS INTEGER) )',
        firstCoAfter: 'WO.ID IN (SELECT Q.ID FROM ( SELECT WO.ID, WO.LAST_MOD FROM WORK_ORDER WO WHERE STATUS_CODE = "CO" UNION ALL SELECT WOH.ID, WOH.LAST_MOD FROM WORK_ORDER_HIST WOH WHERE STATUS_CODE = "CO" ) Q GROUP BY Q.ID HAVING MIN(Q.LAST_MOD) >= CAST(STRFTIME("%%s","%(firstCoAfter)s","utc") AS INTEGER))',
    },
    calculateTotalPrice: {
        dateAfter: '%(dateAfter)s',
        dateBefore: '%(dateBefore)s'
    },
    getOrdersForProtocol: {
        idList: 'WO.ID IN (%(idList)s)',
        protocolNo: 'WO.PROTOCOL_NO = "%(protocolNo)s"'
    },
    checkOrdersForProtocol: {
        idList: '%(idList)s'
    },
    updateOrdersForProtocol: {
        idList: '%(idList)s',
        protocolNo: '%(protocolNo)s'
    },
    getOrdersByIds: {
        idList: 'WO.ID IN (%(idList)s)'
    },
};

const orders_db = {
		
	readByIds: function(idlist, cb) {

        if(idlist) {
            
            var db = dbUtil.getDatabase();
            var params =  {idList: idlist};
            var query = dbUtil.prepareFiltersByInsertion(queries.getOrdersByIds,params,filters.getOrdersByIds);
            
            if(logger().isDebugEnabled()) logger().debug('query for getting orders by ids: ' + query);
            
            var getOrdersStat = db.prepare(query);
            getOrdersStat.all(addCtx(function(err,rows) {

                var calls = [];
                rows.forEach(row => {
                    if(row.ASSIGNEE) row.ASSIGNEE = row.ASSIGNEE.split('|');
                    calls.push((async_cb)=>{
                        var getOrderItemsStat = db.prepare(queries.getOrderItems);
                        getOrderItemsStat.bind(row.ITEM_ID).all(addCtx((err, rows) => {
                            getOrderItemsStat.finalize();
                            if(err) { 
                                async_cb(err); 
                            } else {
                                row.RELATED_ITEMS = rows;
                                async_cb();
                            }
                        }));
                    });
                });

    			async.parallelLimit(calls, 5, addCtx(function(err, result) {
                    getOrdersStat.finalize();
                    db.close();
                    if (err) {
                        logErrAndCall(err,cb);
                    } else {
                        cb(null,rows);
                    }
                }));
            }));
                
        }
        
	},
    
    readAll: function(params, cb) {
        const db = dbUtil.getDatabase();
        // TODO: filtrowanie
        const readFilters = dbUtil.prepareFilters(params,filters.getOrders);
        const query = sprintf(queries.getOrders, readFilters);
        
        if(logger().isDebugEnabled()) logger().debug('query for getting orders: ' + query);

        const getOrdersStat = db.prepare(query);
        getOrdersStat.all(addCtx(function(err,rows) {

            var calls = [];
            rows.forEach(row => {
                if(row.ASSIGNEE) row.ASSIGNEE = row.ASSIGNEE.split('|');
                calls.push((async_cb)=>{
                    var getOrderItemsStat = db.prepare(queries.getOrderItems);
                    getOrderItemsStat.bind(row.ITEM_ID).all(addCtx((err, rows) => {
                        getOrderItemsStat.finalize();
                        if(err) { 
                            async_cb(err); 
                        } else {
                            row.RELATED_ITEMS = rows;
                            async_cb();
                        }
                    }));
                });
            });

			async.parallelLimit(calls, 5, addCtx(function(err, result) {
                getOrdersStat.finalize();
                db.close();
                if (err) {
                    logErrAndCall(err,cb);
                } else {
                    cb(null,rows);
                }
            }));
        }));
    },
    
    read: function(orderId, orderExtId, cb) {
        //TODO: parameter validation
        const db = dbUtil.getDatabase();
        
        let getOrderStat;
        if(orderId != null)  {
            getOrderStat = db.prepare(queries.getOrder);
            getOrderStat.bind(orderId);
        } else if(orderExtId != null) {
            getOrderStat = db.prepare(queries.getOrderByExtId);
            getOrderStat.bind(orderExtId);            
        }
        
		getOrderStat.get(addCtx(function(err, row) {
            getOrderStat.finalize();
            db.close();
			if(err) return logErrAndCall(err,cb);
            
			if(row == null) {
				cb(null,null);
				return;
			}

            if(row.ASSIGNEE) row.ASSIGNEE = row.ASSIGNEE.split('|');
            
            const getOrderItemsStat = db.prepare(queries.getOrderItems);
            getOrderItemsStat.bind(row.ITEM_ID).all(addCtx((err, rows) => {
                getOrderItemsStat.finalize();
                if(err) { 
                    logErrAndCall(err,cb);
                } else {
                    row.RELATED_ITEMS = rows;
                    cb(null,row);
                }
            }));
		}));
    },
    
    readHistory: function(orderId, cb){
        const db = dbUtil.getDatabase();
        const getOrderHistStat = db.prepare(queries.getOrderHistory);
        getOrderHistStat.bind(orderId);
        getOrderHistStat.all(addCtx((err, rows) => {
            getOrderHistStat.finalize();
            db.close();

            if(err) { 
                logErrAndCall(err,cb);
            } else {
                cb(null,rows);
            }
        }));
    },

    update: function(orderId, orderExtId, order, cb) {

        const idObj = {};
        if(orderId != null) {
            idObj.ID = orderId;
        } 
        if(orderExtId != null) {
            idObj.WORK_NO = '"' + orderExtId + '"';
        }

        if(logger().isDebugEnabled()) logger().debug('update order of id ' + util.inspect(idObj) + ' with object: ' + util.inspect(order));        
        dbUtil.performUpdate(idObj, order, 'WORK_ORDER', addCtx(function(err,result) {
            if(err) return logErrAndCall(err,cb);
            cb(null,result);
        }));
    },
    
    create: function(order, cb) {

        const missingWorkNo = (order.WORK_NO) ? false : true;
        let officeCode;
        let seqNo;
        let isFromPool;

        const calls = [];

        calls.push(addCtx(function(_cb){
            var db = dbUtil.getDatabase();
            var getOfficeCodeStat = db.prepare(queries.getOfficeCode);
            getOfficeCodeStat.bind(order.VENTURE_ID);
            getOfficeCodeStat.get(addCtx(function(err,result){
                getOfficeCodeStat.finalize();
                db.close();
                
                if(err) _cb(err);
                else {
                    officeCode = result.OFFICE_CODE;
                    _cb(null);
                }
            }));
        }));

        calls.push(addCtx(function(_cb){
            var db = dbUtil.getDatabase();
            var getIsFromPoolStat = db.prepare(queries.getIsFromPool);
            getIsFromPoolStat.bind([order.TYPE_CODE,order.COMPLEXITY_CODE,officeCode]);
            getIsFromPoolStat.get(addCtx(function(err,result){
                getIsFromPoolStat.finalize();
                db.close();

                if(err) _cb(err);
                else {
                    isFromPool = result.IS_FROM_POOL;
                    _cb(null);
                }
            }));

        }));

        if(!order.WORK_NO) {
            calls.push((_cb)=>{
                dbUtil.getNextSeq('WO_SEQ',addCtx(function(err, seqVal){
                    if(err) _cb(err);
                    else {
                        seqNo = seqVal;
                        _cb(null);
                    }
                }));
            });
        }
        
        async.series(
            calls,
            addCtx(function(err, result) {
                if(err) cb(err);
                else {
                    if(logger().isDebugEnabled()) logger().debug('office code ' + officeCode + ' isFromPool ' + isFromPool);
                    if(missingWorkNo) order.WORK_NO = officeCode + seqNo;
                    order.OFFICE_CODE = officeCode;
                    order.IS_FROM_POOL = isFromPool;
                    order.STATUS_CODE = 'OP';

                    if(logger().isDebugEnabled()) logger().debug('insert order with object: ' + util.inspect(order));
            
                    dbUtil.performInsert(order, 'WORK_ORDER', null, function(err, newId){
                        if(err) return logErrAndCall(err,cb);
                        cb(null,newId);
                    });
                }
            }
        ));
    },
/*
    calculateTotalPriceForCompleted: function(params,cb) {
        console.log(JSON.stringify(params));
        var query = dbUtil.prepareFiltersByInsertion(queries.calculateTotalPriceStat,params,filters.calculateTotalPrice);
        console.log(query);
        var db = dbUtil.getDatabase();
        var calculateTotalPriceStat = db.prepare(query);
        calculateTotalPriceStat.all(function(err, rows) {
            calculateTotalPriceStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
			cb(null,rows[0]);
		});
    },
*/
    prepareOrdersForProtocol: function(idlist, protocolNo, cb) {
        
        let protNo = protocolNo;
        const calls = [];

        if(idlist) {
            calls.push(addCtx(function(_cb){
                var db = dbUtil.getDatabase();
                var params =  {idList: idlist};
                var query = dbUtil.prepareFiltersByInsertion(queries.checkOrdersForProtocol,params,filters.checkOrdersForProtocol);
                var checkOrdersStat = db.prepare(query);      
                checkOrdersStat.all(function(err,rows){
                    checkOrdersStat.finalize();
                    db.close();
                    
                    if(rows.length > 0) {
                        const checkErr = new Error('Zamówienia o niewłaściwym statusie lub posiadające już numer protokołu: ' + rows.map((r)=>{return r.WORK_NO;}).join(','));
                        checkErr.type = 'custom';
                        _cb(checkErr);
                    } else if(err) _cb(err);
                    else _cb(null);
                });
            }));
            
            calls.push(addCtx(function(_cb){
                dbUtil.getNextSeq('PROTOCOL_NO_SEQ',addCtx(function(err, seqVal){
                    if(err) _cb(err);
                    else  _cb(null,seqVal);
                }));
            }));
            
            calls.push(addCtx(function(seqVal,_cb){
                
                protNo = 
                'A' + new Date().getFullYear().toString().substr(-2) + '/'
                      + ((new Date().getMonth() < 10) ? '0' : '') + new Date().getMonth().toString()
                      + '/' + seqVal;
                if(logger().isDebugEnabled()) logger().debug('protocol nuber ' + protNo);
                
                const db = dbUtil.getDatabase();
                const params =  {
                    idList: idlist,
                    protocolNo: protNo
                };
                const update = dbUtil.prepareFiltersByInsertion(queries.updateOrdersForProtocol,params,filters.updateOrdersForProtocol);
                const updateOrdersStat = db.prepare(update);      
                updateOrdersStat.run(addCtx(function(err,rows){
                    updateOrdersStat.finalize();
                    db.close();
                    
                    if(err) _cb(err);
                    else _cb();
                }));
            }));
        } 

        calls.push(addCtx(function(_cb){
            const db = dbUtil.getDatabase();
            const params =  {
                            idList: (idlist) ? idlist : '',
                            protocolNo: (protocolNo) ? protocolNo : ''
                        };
            const query = dbUtil.prepareFiltersByInsertion(queries.getOrdersForProtocol,params,filters.getOrdersForProtocol);
            const getOrdersForProtocolStat = db.prepare(query);
            getOrdersForProtocolStat.all(addCtx(function(err,rows) {
                getOrdersForProtocolStat.finalize();
                db.close();
                
                if(err) return logErrAndCall(err,cb);
                _cb(null,rows);
            }));
        }));

        async.waterfall(
            calls,
            addCtx(function(err, result) {                
                if(err) return logErrAndCall(err,cb);
                cb(null,[protNo,result]);
            }));
    }
};

module.exports = orders_db;
