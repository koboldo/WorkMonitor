'use strict';

var sqlite3 = require('sqlite3').verbose();
var util = require('util');

var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 
var logErrAndCall = require('../local_util').logErrAndCall;

var db_util = {
    
    getDatabase: function() {
        var db = new sqlite3.Database('./work-monitor.db');
        db.serialize(function() {
            db.run( 'PRAGMA journal_mode = WAL;' );
            db.run( 'PRAGMA busy_timeout = 1000;' );
        });
        return db;
    },
    
    performInsert: function(object, tableName, maxIdQuery, cb) {
        var db = db_util.getDatabase();
        var insertStr = db_util.prepareInsert(object, tableName);
        var insertStat = db.prepare(insertStr);      
        insertStat.run(function(err, result){
            insertStat.finalize();
            db.close();
            if(err){
                return logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('inserted row id: ' + this.lastID);
                cb(null, this.lastID);
            }
        });
    },
    
    performUpdate: function(idObj, object, tableName, cb) {
        var db = db_util.getDatabase();
        var updateStr = db_util.prepareUpdate(idObj, object, tableName);
        var updateStat = db.prepare(updateStr);   
        updateStat.run(function(err,result) {
            updateStat.finalize();
            db.close();
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('changes caused by update: ' + this.changes);
                cb(null,this.changes);
            }
        });
    },

    prepareInsert: function(object, tableName) {
        var sqlCols = '';
        var sqlVals = '';
        for(var col in object) {
            if(sqlCols.length > 0) sqlCols += ', ';
            if(sqlVals.length > 0) sqlVals += ', ';
            sqlCols +=  col;
            sqlVals += '"' + object[col] + '"';
        }

        var insertStr = 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
        if(logger.isDebugEnabled()) logger.debug('db insert: ' + insertStr);
        return insertStr;
    },
    
    // BEWARE UPDATING WORK_ORDER_HIST TABLE ...
    prepareUpdate: function(idObj, object, tableName) {
        var updateStr = '';
        for(var col in object) {
            if(col == 'ID') continue;
            
            if(updateStr.length > 0) {
                updateStr += ', ';
            }
            updateStr += col + '="' + object[col] + '"';
        }
    
        var updateStr = 'UPDATE ' + tableName + ' SET ' + updateStr + ' WHERE ' + idObj.name + ' = "' + idObj.value + '"';
        if(logger.isDebugEnabled()) logger.debug('db insert: ' + updateStr);
        return updateStr;
    },
    
    prepareFilters: function(params,queryFilters) {
        if(params == null || Object.getOwnPropertyNames(params).length == 0) {
            return "";
        }
        
        var filterText = " WHERE ";
        for(var filter in queryFilters) {
            if(params[filter]) {
                if(filterText.length > 7) filterText += " AND "
                
                var obj = {};
                obj[filter] = params[filter];
                filterText += sprintf(queryFilters[filter], obj);
            }    
        }  
        return filterText;
    },
    
    getRowsIds: function(statement, rowId, cb) {
		statement.bind(rowId).all(function(err,rows){
			var ids = [];
			rows.forEach(function(row){
				ids.push(row.ID);
			});
			cb(ids);
		});
	}
};

module.exports = db_util;
