/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var logErrAndCall = require('../local_util').logErrAndCall;
var logger = require('../logger').getLogger('monitor'); 

var queries = {
	getOrders:		 ' SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, MD_CAPEX, PROTOCOL_NO, PRICE, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(CREATED,"unixepoch") AS CREATED, ITEM_ID, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID) AS ASSIGNEE, VENTURE_ID FROM WORK_ORDER AS WO %s ORDER BY WO.LAST_MOD DESC',
	getOrder:		 ' SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, MD_CAPEX, PROTOCOL_NO, PRICE, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(CREATED,"unixepoch") AS CREATED, ITEM_ID, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID) AS ASSIGNEE, VENTURE_ID FROM WORK_ORDER AS WO WHERE ID = ?',
	getOrderByExtId:		 ' SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, MD_CAPEX, PROTOCOL_NO, PRICE, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(CREATED,"unixepoch") AS CREATED, ITEM_ID, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID) AS ASSIGNEE, VENTURE_ID FROM WORK_ORDER AS WO WHERE WORK_NO = ?',
    getOrderItems:   'SELECT RI.ID, RI.ITEM_NO, RI.DESCRIPTION, RI.ADDRESS, RI.MD_BUILDING_TYPE, RI.MD_CONSTRUCTION_CATEGORY, DATETIME(RI.CREATED,"unixepoch") AS CREATED FROM RELATED_ITEM AS RI WHERE RI.ID = ?',
    calculateTotalPriceStat: `WITH PARAMS AS ( SELECT STRFTIME('%%s', '%(dateAfter)s') AS AFTER_DATE ,STRFTIME('%%s', '%(dateBefore)s') + 86400 AS BEFORE_DATE ) 
                                SELECT SUM(PRICE) AS TOTAL_PRICE, COUNT(WORK_NO) AS WO_COUNT FROM 
                                ( SELECT ID ,WORK_NO ,PRICE FROM WORK_ORDER WHERE ( STATUS_CODE = 'CO' AND LAST_MOD BETWEEN ( SELECT AFTER_DATE FROM PARAMS ) AND ( SELECT BEFORE_DATE FROM PARAMS ) )  
                                UNION  SELECT ID ,WORK_NO ,PRICE FROM WORK_ORDER_HIST WHERE 
                                    ( STATUS_CODE = 'CO' AND LAST_MOD BETWEEN ( SELECT AFTER_DATE FROM PARAMS ) AND ( SELECT BEFORE_DATE FROM PARAMS ) ) ) `
};

// js object used by sprintf function to prepare WHERE condition
var filters = {
    getOrders: {
        type: 'TYPE_CODE = "%(type)s"',
        status: 'STATUS_CODE = "%(status)s"',
        lastModBefore: 'LAST_MOD <= STRFTIME("%%s","%(lastModBefore)s")',
        lastModAfter: 'LAST_MOD >= STRFTIME("%%s","%(lastModAfter)s")',
        personId: 'WO.ID in (SELECT WO_ID FROM PERSON_WO WHERE PERSON_ID = %(personId)s)',
    },
    calculateTotalPrice: {
        dateAfter: '%(dateAfter)s',
        dateBefore: '%(dateBefore)s'
    }
};

var orders_db = {
    
    readAll: function(params, cb) {
        var db = dbUtil.getDatabase();
        // TODO: filtrowanie
        var readFilters = dbUtil.prepareFilters(params,filters.getOrders);
        // var query = queries.getOrders + readFilters;
        var query = sprintf(queries.getOrders, readFilters);
        
        if(logger.isDebugEnabled()) logger.debug('query for getting orders: ' + query);

        var getOrdersStat = db.prepare(query);
        getOrdersStat.all(function(err,rows) {

            var calls = [];
            rows.forEach(row => {
                if(row.ASSIGNEE) row.ASSIGNEE = row.ASSIGNEE.split('|');
                calls.push((async_cb)=>{
                    var getOrderItemsStat = db.prepare(queries.getOrderItems);
                    getOrderItemsStat.bind(row.ITEM_ID).all((err, rows) => {
                        getOrderItemsStat.finalize();
                        if(err) { 
                            async_cb(err); 
                        } else {
                            row.RELATED_ITEMS = rows;
                            async_cb();
                        }
                    });
                });
            });

			async.parallelLimit(calls, 5, function(err, result) {
                getOrdersStat.finalize();
                db.close();
                if (err) {
                    local_util.logErrAndCall(err,cb);
                } else {
                    cb(null,rows);
                }
            });
        });
    },
    
    read: function(orderId, orderExtId, cb) {
        //TODO: parameter validation
        var db = dbUtil.getDatabase();
        
        var getOrderStat;
        if(orderId != null)  {
            getOrderStat = db.prepare(queries.getOrder);
            getOrderStat.bind(orderId);
        } else if(orderExtId != null) {
            getOrderStat = db.prepare(queries.getOrderByExtId);
            getOrderStat.bind(orderExtId);            
        }
        
		getOrderStat.get(function(err, row) {
            getOrderStat.finalize();
            db.close();
			if(err) return local_util.logErrAndCall(err,cb);
            
			if(row == null) {
				cb(null,null);
				return;
			}

            if(row.ASSIGNEE) row.ASSIGNEE = row.ASSIGNEE.split('|');
            
            var getOrderItemsStat = db.prepare(queries.getOrderItems);
            getOrderItemsStat.bind(row.ITEM_ID).all((err, rows) => {
                getOrderItemsStat.finalize();
                if(err) { 
                    local_util.logErrAndCall(err,cb);
                } else {
                    row.RELATED_ITEMS = rows;
                    cb(null,row);
                }
            });
		});
    },
    
    update: function(orderId, orderExtId, order, cb) {

        var idObj = {};
        if(orderId != null) {
            // idObj.name = 'ID';
            // idObj.value = orderId;
            idObj.ID = orderId;
        } 
        if(orderExtId != null) {
            // idObj.name = 'WORK_NO';
            // idObj.value = orderExtId;
            idObj.WORK_NO = '"' + orderExtId + '"';
        }

        if(logger.isDebugEnabled()) logger.debug('update order of id ' + util.inspect(idObj) + ' with object: ' + util.inspect(order));
        
        dbUtil.performUpdate(idObj, order, 'WORK_ORDER', function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        });
    },
    
    create: function(order, cb) {
        
        if(logger.isDebugEnabled()) logger.debug('insert order with object: ' + util.inspect(order));

        dbUtil.performInsert(order, 'WORK_ORDER', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    },

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
    }
};

module.exports = orders_db;
