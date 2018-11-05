/* jshint node: true, esversion: 6 */
'use strict';

const logErrAndCall = require('../local_util').logErrAndCall;
const addCtx = require('../logger').addCtx;
const dbUtil = require('./db_util');

const queries = {
	getCodes: 'SELECT CODE, PARAM_INTVAL, PARAM_CHARVAL FROM CODE_REFERENCE WHERE CODE_TABLE = ? ORDER BY PARAM_INTVAL',
    getTables: 'SELECT DISTINCT CODE_TABLE FROM CODE_REFERENCE'
};

const codes_db = {
    
    readCodes: function(codeTable, cb) {
        const db = dbUtil.getDatabase();
        const getCodesStat = db.prepare(queries.getCodes);
        getCodesStat.bind(codeTable).all(addCtx(function(err,rows) {
            getCodesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        }));
    },
    
    readTables: function(cb) {
        const db = dbUtil.getDatabase();
        const getTablesStat = db.prepare(queries.getTables);
        getTablesStat.all(addCtx(function(err,rows) {
            getTablesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        }));
    }
};

module.exports = codes_db;