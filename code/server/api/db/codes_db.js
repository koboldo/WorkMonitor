var sqlite3 = require('sqlite3');
var util = require('util');

var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getCodes: 'SELECT CODE, PARAM_INTVAL, PARAM_CHARVAL FROM CODE_REFERENCE WHERE CODE_TABLE = ?',
    getTables: 'SELECT DISTINCT CODE_TABLE FROM CODE_REFERENCE'
};

var codes_db = {
    
    readCodes: function(codeTable, cb) {
        var getCodesStat = db.prepare(queries.getCodes);
        getCodesStat.bind(codeTable).all(function(err,rows) {
            if(err) return logErrAndCall(err,cb);
            cb(null,rows)
        });
    },
    
    readTables: function(cb) {
        var getTablesStat = db.prepare(queries.getTables);
        getTablesStat.all(function(err,rows) {
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        });
    }
};

module.exports = codes_db;