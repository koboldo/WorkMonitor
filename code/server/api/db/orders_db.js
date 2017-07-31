var sqlite3 = require('sqlite3');
var util = require('util');
var logger = require('../../logger').getLogger('monitor'); 
var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getOrders: 'SELECT ID, WORK_NO, STATUS_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, PRICE, VERSION, LAST_MOD FROM WORK_ORDER',
	getOrder: 'SELECT ID, WORK_NO, STATUS_CODE, COMPLEXITY_CODE, COMPLEXITY, DESCRIPTION, COMMENT, PRICE, VERSION, LAST_MOD FROM WORK_ORDER WHERE ID = ?',
};

// var filters = {
    // getOrders: {
        // lastModBefore: 
    // }
// };

var orders_db = {
    
    readAll: function(params, cb) {
        // TODO: filtrowanie
        // if(params.)
        
        var getOrdersStat = db.prepare(queries.getOrders);
        getOrdersStat.all(function(err,rows) {
            if(err) return logErrAndCall(err,cb);
            cb(null,rows)
        });
    },
    
    read: function(orderId, cb) {
        //TODO: parameter validation
        var getOrderStat = db.prepare(queries.getOrder);
		getOrderStat.bind(orderId).get(function(err, row) {
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
            
			// var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			// tools.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
				// row.WORK_ORDERS = ids;
				// cb(null,row);
			// });
		});
    }
};

function logErrAndCall(err,cb) {
	logger.error(err.message);
	cb(err.message);
}

// module.exports = orders_db;
orders_db.readAll(null, function(err, rows) { 
    rows.forEach(function(row) {
        logger.info(row);
    });
});

orders_db.read(1, function(err, row) { 
    logger.info("-----------");
    logger.info(row);
    logger.info("-----------");
});