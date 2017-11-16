/* jshint node: true */
'use strict';

// var sqlite3 = require('sqlite3');
var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 

var queries = {
	getOrders:		 'SELECT WORK_ORDER.ID, WORK_ORDER.WORK_NO, WORK_ORDER.STATUS_CODE, WORK_ORDER.TYPE_CODE, WORK_ORDER.COMPLEXITY_CODE, WORK_ORDER.COMPLEXITY, WORK_ORDER.DESCRIPTION, WORK_ORDER.COMMENT, WORK_ORDER.MD_CAPEX, WORK_ORDER.PROTOCOL_NO, WORK_ORDER.PRICE, DATETIME(WORK_ORDER.LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(WORK_ORDER.CREATED,"unixepoch") AS CREATED, WORK_ORDER.ITEM_ID, RELATED_ITEM.ITEM_NO, RELATED_ITEM.DESCRIPTION AS RI_DESC, RELATED_ITEM.ADDRESS, RELATED_ITEM.MD_BUILDING_TYPE, RELATED_ITEM.MD_CONSTRUCTION_CATEGORY, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WORK_ORDER.ID) AS ASSIGNEE FROM WORK_ORDER LEFT JOIN RELATED_ITEM ON RELATED_ITEM.ID = WORK_ORDER.ITEM_ID',
  //getOrders:       'SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, MD_CAPEX, PROTOCOL_NO, PRICE, ITEM_ID, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(CREATED,"unixepoch") AS CREATED, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WO.ID) AS ASSIGNEE FROM WORK_ORDER AS WO',
	getOrder:        'SELECT WORK_ORDER.ID, WORK_ORDER.WORK_NO, WORK_ORDER.STATUS_CODE, WORK_ORDER.TYPE_CODE, WORK_ORDER.COMPLEXITY_CODE, WORK_ORDER.COMPLEXITY, WORK_ORDER.DESCRIPTION, WORK_ORDER.COMMENT, WORK_ORDER.MD_CAPEX, WORK_ORDER.PROTOCOL_NO, WORK_ORDER.PRICE, DATETIME(WORK_ORDER.LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(WORK_ORDER.CREATED,"unixepoch") AS CREATED, WORK_ORDER.ITEM_ID, RELATED_ITEM.ITEM_NO, RELATED_ITEM.DESCRIPTION AS RI_DESC, RELATED_ITEM.ADDRESS, RELATED_ITEM.MD_BUILDING_TYPE, RELATED_ITEM.MD_CONSTRUCTION_CATEGORY, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WORK_ORDER.ID) AS ASSIGNEE FROM WORK_ORDER LEFT JOIN RELATED_ITEM ON RELATED_ITEM.ID = WORK_ORDER.ITEM_ID WHERE WORK_ORDER.ID = ?',
	getOrderByExtId: 'SELECT WORK_ORDER.ID, WORK_ORDER.WORK_NO, WORK_ORDER.STATUS_CODE, WORK_ORDER.TYPE_CODE, WORK_ORDER.COMPLEXITY_CODE, WORK_ORDER.COMPLEXITY, WORK_ORDER.DESCRIPTION, WORK_ORDER.COMMENT, WORK_ORDER.MD_CAPEX, WORK_ORDER.PROTOCOL_NO, WORK_ORDER.PRICE, DATETIME(WORK_ORDER.LAST_MOD,"unixepoch") AS LAST_MOD, DATETIME(WORK_ORDER.CREATED,"unixepoch") AS CREATED, WORK_ORDER.ITEM_ID, RELATED_ITEM.ITEM_NO, RELATED_ITEM.DESCRIPTION AS RI_DESC, RELATED_ITEM.ADDRESS, RELATED_ITEM.MD_BUILDING_TYPE, RELATED_ITEM.MD_CONSTRUCTION_CATEGORY, (SELECT GROUP_CONCAT(P.EMAIL, "|") FROM PERSON AS P, PERSON_WO AS PWO WHERE P.ID = PWO.PERSON_ID AND PWO.WO_ID = WORK_ORDER.ID) AS ASSIGNEE FROM WORK_ORDER LEFT JOIN RELATED_ITEM ON RELATED_ITEM.ID = WORK_ORDER.ITEM_ID WHERE WORK_ORDER.WORK_NO = ?',
    // getMaxOrderId: 'SELECT MAX(ID) AS MAX_ID FROM WORK_ORDER',
};

// js object used by sprintf function to prepare WHERE condition
var filters = {
    getOrders: {
        type: 'TYPE_CODE = "%(type)s"',
        status: 'STATUS_CODE = "%(status)s"',
        lastModBefore: 'LAST_MOD <= STRFTIME("%%s","%(lastModBefore)s")',
        lastModAfter: 'LAST_MOD >= STRFTIME("%%s","%(lastModAfter)s")',
        personId: 'ID in (SELECT WO_ID FROM PERSON_WO WHERE PERSON_ID = %(personId)s)',
    }
};

var orders_db = {
    
    readAll: function(params, cb) {
        var db = dbUtil.getDatabase();
        // TODO: filtrowanie
        var readFilters = dbUtil.prepareFilters(params,filters.getOrders);
        var query = queries.getOrders + readFilters;
        
        if(logger.isDebugEnabled()) logger.debug('query for getting orders: ' + query);

        var getOrdersStat = db.prepare(query);
        getOrdersStat.all(function(err,rows) {
            getOrdersStat.finalize();
            db.close();
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,rows);
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
            cb(null,row);
		});
    },
    
    update: function(orderId, orderExtId, order, cb) {

        var idObj = {};
        if(orderId != null) {
            idObj.name = 'ID';
            idObj.value = orderId;
        } 
        if(orderExtId != null) {
            idObj.name = 'WORK_NO';
            idObj.value = orderExtId;
            
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
    }
};

module.exports = orders_db;
