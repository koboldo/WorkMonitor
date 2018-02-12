/* jshint node: true, esversion: 6 */
'use strict';

var sqlite3 = require('sqlite3').verbose();
// var util = require('util');
var path = require('path');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var logger = require('../logger').getLogger('monitor'); 
var logErrAndCall = require('../local_util').logErrAndCall;

var insertSeq = 'INSERT INTO SEQUENCER (SEQ_NAME,SEQ_VAL) VALUES ( $NAME , ( SELECT COALESCE(MAX(SEQ_VAL),0) + 1 FROM SEQUENCER WHERE SEQ_NAME = $NAME ))';
var querySeq = 'SELECT SEQ_VAL FROM SEQUENCER WHERE ROWID = ?';

var columnsToSkip = ['ID','LAST_MOD','CREATED'];
var columnsWithoutQuote = ['WORK_DATE', 'FROM_DATE', 'TO_DATE','BREAK'];

var db_util = {
    
    getDatabase: function() {
        var dbPath = path.join(process.env.WM_CONF_DIR, 'work-monitor.db');

        if(logger.isDebugEnabled()) logger.debug('connecting to db in location ' + dbPath);
        var db = new sqlite3.Database(dbPath);
        db.serialize(function() {
            db.run( 'PRAGMA journal_mode = DELETE;' );
            db.run( 'PRAGMA busy_timeout = 10000;' );
            db.run( 'PRAGMA foreign_keys = ON;' );
        });
        return db;
    },
    
    performInsert: function(object, tableName, maxIdQuery, cb, db) {
        var myDB = (db == null) ? db_util.getDatabase() : db;
        var insertStr = db_util.prepareInsert(object, tableName);
        var insertStat = myDB.prepare(insertStr);      
        insertStat.run(function(err, result){
            insertStat.finalize();
            if(db == null) myDB.close();
            if(err){
                return logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('inserted row id: ' + this.lastID);
                cb(null, this.lastID);
            }
        });
    },
    
    performUpdate: function(idObj, object, tableName, cb, db) {
        var myDB = (db == null) ? db_util.getDatabase() : db;
        var updateStr = db_util.prepareUpdate(idObj, object, tableName);
        var updateStat = myDB.prepare(updateStr);   
        updateStat.run(function(err,result) {
            updateStat.finalize();
            if(db == null) myDB.close();
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('changes caused by update: ' + this.changes);
                cb(null,this.changes);
            }
        });
    },

    performDelete: function(idObj, tableName, cb, db) {
        var myDB = (db == null) ? db_util.getDatabase() : db;
        var deleteStr = db_util.prepareDelete(idObj,'PERSON_WO');
        var deleteStat = myDB.prepare(deleteStr);
        deleteStat.run(function(err, result){
            deleteStat.finalize();
            if(db == null) myDB.close();
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('changes caused by delete: ' + this.changes);
                cb(null,this.changes);
            }
        });
    },
    
    startTx: function(db,cb) {
        db.run('BEGIN',(err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('transaction started');
                cb(null,'success');
            }
        });
    },

    commitTx: function(db,cb) {
        db.run('COMMIT',(err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('transaction committed');
                if(cb != null) cb(null,'success');
            }
        });
    },

    rollbackTx: function(db,cb) {
        db.run('ROLLBACK',(err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger.isDebugEnabled()) logger.debug('transaction has been rollback');
                if(cb != null) cb(null,'success');
            }
        });
    },

    prepareInsert: function(object, tableName) {
        var sqlCols = '';
        var sqlVals = '';
        for(var col in object) {
            if(columnsToSkip.indexOf(col) > -1 ) continue;

            if(sqlCols.length > 0) sqlCols += ', ';
            if(sqlVals.length > 0) sqlVals += ', ';
            sqlCols +=  col;


            // sqlVals += '"' + object[col] + '"';
            // let val = db_util.changeEmptyToNull(object[col]);
            if(columnsWithoutQuote.indexOf(col) > -1) sqlVals += object[col];
            else sqlVals += '"' + object[col] + '"';
        }

        var insertStr = 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
        if(logger.isDebugEnabled()) logger.debug('db insert: ' + insertStr);
        return insertStr;
    },

    // BEWARE UPDATING WORK_ORDER_HIST TABLE ...
    prepareUpdate: function(idObj, object, tableName) {
        var updateStr = '';
        for(var col in object) {
            if(columnsToSkip.indexOf(col) > -1 ) continue;
            
            if(updateStr.length > 0) {
                updateStr += ', ';
            }

            // updateStr += col + '="' + object[col] + '"';
            updateStr += col + '=';
            let val = db_util.changeEmptyStringToNull(object[col]);
            if(columnsWithoutQuote.indexOf(col) > -1 || val == null ) updateStr += val;
            else updateStr += '"' + val + '"';
        }

        var idStr = '';
        for(var idKey in idObj) {
            if(idStr.length > 0) idStr += ' AND ';
            idStr += idKey + ' = ' + idObj[idKey];
        }        

        updateStr = 'UPDATE ' + tableName + ' SET ' + updateStr + ' WHERE ' + idStr;
        if(logger.isDebugEnabled()) logger.debug('db update: ' + updateStr);
        return updateStr;
    },
    
    prepareDelete: function(idObj, tableName) {

        var deleteStr = '';
        for(var idKey in idObj) {
            if(deleteStr.length > 0) deleteStr += ' AND ';
            deleteStr += idKey + ' = ' + idObj[idKey];
        }
        
        deleteStr = 'DELETE FROM ' + tableName + ' WHERE ' + deleteStr;
        if(logger.isDebugEnabled()) logger.debug('db delete: ' + deleteStr);
        return deleteStr;
    },

    prepareFilters: function(params,queryFilters) {
        if(params == null || Object.getOwnPropertyNames(params).length == 0) {
            return "";
        }
        
        var filterText = " WHERE ";
        for(var filter in queryFilters) {
            if(params[filter]) {
                if(filterText.length > 7) filterText += " AND ";
                
                var obj = {};
                obj[filter] = params[filter];
                filterText += sprintf(queryFilters[filter], obj);
            }    
        }  
        return filterText;
    },
    
    prepareFiltersByInsertion: function(query,params,queryFilters) {
        var filterInserts = {};
        for(var filter in queryFilters) {
            var filterVal = '';
            if(params[filter]) {
                var obj = {};
                obj[filter] = params[filter];
                filterVal = sprintf(queryFilters[filter], obj);
            }
            filterInserts[filter] = filterVal;
        }

        if(logger.isDebugEnabled()) logger.debug('filterInserts: ' + JSON.stringify(filterInserts));
        var rv = sprintf(query,filterInserts);
        return rv;
    },

    changeEmptyStringToNull: function(sqlValue) {
        if(typeof sqlValue === 'string') 
            return (sqlValue.length > 0) ? sqlValue : null; 
        else 
            return sqlValue;
    },
    
    getNextSeq: function(seqName, cb) {
    
        var db = db_util.getDatabase();
        var insertStat = db.prepare(insertSeq);
        var seqQueryStat = db.prepare(querySeq);
        
        var rowid;
    
        var calls = [];
        calls.push(function(_cb) {
            insertStat.run({$NAME: seqName}, function(err,result){
                insertStat.finalize();
                if(err) _cb(err);
                else {
                    rowid = this.lastID;
                    _cb(null,this.lastID);
                } 
            });
        });
        
        calls.push(function(_cb) {
            seqQueryStat.bind(rowid);
            seqQueryStat.get(function(err,results){
                seqQueryStat.finalize();
                if(err) _cb(err);
                else _cb(null,results);
            });
        });
        
        async.series(
            calls,
            function(err, results) {
                db.close();
                if(err) {
                    return cb(err);
                } else {
                    cb(null,results[1].SEQ_VAL);
                }
            });
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
