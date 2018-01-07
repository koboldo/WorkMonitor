var sqlite3 = require('sqlite3');
var util = require('util');
var logger = require('../logger').getLogger('monitor'); 
var logErrAndCall = require('../local_util').logErrAndCall;
var dbUtil = require('./db_util');

var queries = {
	getCodes: 'SELECT CODE, PARAM_INTVAL, PARAM_CHARVAL FROM CODE_REFERENCE WHERE CODE_TABLE = ? ORDER BY PARAM_INTVAL',
    getTables: 'SELECT DISTINCT CODE_TABLE FROM CODE_REFERENCE'
};

var codes_db = {
    
    readCodes: function(codeTable, cb) {
        var db = dbUtil.getDatabase();
        var getCodesStat = db.prepare(queries.getCodes);
        getCodesStat.bind(codeTable).all(function(err,rows) {
            getCodesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        });
    },
    
    readTables: function(cb) {
        var db = dbUtil.getDatabase();
        var getTablesStat = db.prepare(queries.getTables);
        getTablesStat.all(function(err,rows) {
            getTablesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        });
    }
};

module.exports = codes_db;