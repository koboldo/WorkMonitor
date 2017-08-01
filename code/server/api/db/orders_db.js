'use strict';

var sqlite3 = require('sqlite3');
var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 
var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getOrders: 'SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, PRICE, VERSION, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD FROM WORK_ORDER',
	getOrder: 'SELECT ID, WORK_NO, STATUS_CODE, TYPE_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, PRICE, VERSION, DATETIME(LAST_MOD,"unixepoch") AS LAST_MOD FROM WORK_ORDER WHERE ID = ?',
    // getMaxOrderId: 'SELECT MAX(ID) AS MAX_ID FROM WORK_ORDER',
};

var filters = {
    getOrders: {
        type: 'TYPE_CODE = "%(type)s"',
        lastModBefore: 'LAST_MOD <= STRFTIME("%%s","%(lastModBefore)s")',
        lastModAfter: 'LAST_MOD >= STRFTIME("%%s","%(lastModAfter)s")',
    }
};

var orders_db = {
    
    readAll: function(params, cb) {
        
        // TODO: filtrowanie
        var readFilters = dbUtil.prepareFilters(params,filters.getOrders);
        var query = queries.getOrders + readFilters;
        
        var getOrdersStat = db.prepare(query);
        getOrdersStat.all(function(err,rows) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,rows)
        });
    },
    
    read: function(orderId, cb) {
        //TODO: parameter validation
        var getOrderStat = db.prepare(queries.getOrder);
		getOrderStat.bind(orderId).get(function(err, row) {
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
		});
    },
    
    update: function(orderId, order, cb) {
        dbUtil.performUpdate(orderId, order, 'WORK_ORDER', function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        });
    },
    
    create: function(order, cb) {
        dbUtil.performInsert(order, 'WORK_ORDER', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = orders_db;
