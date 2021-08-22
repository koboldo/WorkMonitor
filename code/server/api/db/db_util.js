/* jshint node: true, esversion: 6 */
'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const async = require('async');
const nanoid = require('nanoid');
const sprintf = require("sprintf-js").sprintf;
const logger = require('../logger').logger;
const addCtx = require('../logger').addCtx;
const logErrAndCall = require('../local_util').logErrAndCall;

var insertSeq = 'INSERT INTO SEQUENCER (SEQ_NAME,SEQ_VAL) VALUES ( $NAME , ( SELECT COALESCE(MAX(SEQ_VAL),0) + 1 FROM SEQUENCER WHERE SEQ_NAME = $NAME ))';
var querySeq = 'SELECT SEQ_VAL FROM SEQUENCER WHERE ROWID = ?';

const columnsToSkip = ['ID','LAST_MOD','CREATED'];
const columnsWithoutQuote = ['WORK_DATE', 'FROM_DATE', 'TO_DATE','BREAK','TRAINING'];

const proxyHandler = {
    get(target, propKey, receiver) {
		var propValue = target[propKey];
		if (typeof propValue != "function"){
			return propValue;
		}
		else{
			return addCtx(function() {
				if(propKey == 'close') logger().debug("proxy call to " + propKey + " of " + receiver.proxyId);
                let retVal = propValue.apply(target, arguments);
                
                //return retVal;

                if(retVal.hasOwnProperty('proxyId')) return retVal;
                
                let proxyRetVal = new Proxy(retVal,proxyHandler);
                proxyRetVal.proxyId = nanoid(16);
                return proxyRetVal;
			});
		}
    }
};

const db_util = {
    
    getDatabase: function() {
        // logger().error(new Error("my stack for getting db handler").stack);
        let dbPath = path.join(process.env.WM_CONF_DIR, 'work-monitor.db');

        let db = new sqlite3.Database(dbPath,sqlite3.OPEN_READWRITE,addCtx(function(err) {
                if(err) {
                    logger().err('error while connecting to db ' + err.name + ' ' + err.message);
                } else {
                    if(logger().isDebugEnabled()) logger()
                                    .debug('connected successfully to db in location ' + dbPath + ' of ' + proxyDb.proxyId);
                }
        }));

        db.on('profile', addCtx(function(sql,tm){
            logger().debug('sql ' + sql);
            logger().debug('time ' + tm);
        }));

        db.serialize(function() {
            db.exec( 'PRAGMA journal_mode = WAL;' )
                .exec( 'PRAGMA busy_timeout = 10000;' )
                .exec( 'PRAGMA foreign_keys = ON;' )
                .exec( 'PRAGMA temp_store = 2;' );
        });

        const proxyDb = new Proxy(db, proxyHandler);
        proxyDb.proxyId = nanoid(16);
        logger().debug('getting db handler ' + proxyDb.proxyId);
        return proxyDb;

        // return db;
    },
    
    performInsert: function(object, tableName, maxIdQuery, cb, db) {
        let myDB = (db == null) ? db_util.getDatabase() : db;
        let insertStr = db_util.prepareInsert(object, tableName);
        let insertStat = myDB.prepare(insertStr);      
        insertStat.run(addCtx(function(err, result){
            insertStat.finalize();
            if(db == null) myDB.close();
            if(err){
                return logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('inserted row id: ' + this.lastID);
                cb(null, this.lastID);
            }
        }));
    },
    
    performReplace: function(object, tableName, maxIdQuery, cb, db) {
        let myDB = (db == null) ? db_util.getDatabase() : db;
        let replaceStr = db_util.prepareReplace(object, tableName);
        let replaceStat = myDB.prepare(replaceStr);      
        replaceStat.run(addCtx(function(err, result){
            replaceStat.finalize();
            if(db == null) myDB.close();
            if(err){
                return logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('replaced row id: ' + this.lastID);
                cb(null, this.lastID);
            }
        }));
    },

    performUpdate: function(idObj, object, tableName, cb, db) {
        let myDB = (db == null) ? db_util.getDatabase() : db;
        let updateStr = db_util.prepareUpdate(idObj, object, tableName);
        let updateStat = myDB.prepare(updateStr);   
        updateStat.run(addCtx(function(err,result) {
            updateStat.finalize();
            if(db == null) myDB.close();
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('changes caused by update: ' + this.changes);
                cb(null,this.changes);
            }
        }));
    },

    performDelete: function(idObj, tableName, cb, db) {
        let myDB = (db == null) ? db_util.getDatabase() : db;
        let deleteStr = db_util.prepareDelete(idObj,'PERSON_WO');
        let deleteStat = myDB.prepare(deleteStr);
        deleteStat.run(addCtx(function(err, result){
            deleteStat.finalize();
            if(db == null) myDB.close();
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('changes caused by delete: ' + this.changes);
                cb(null,this.changes);
            }
        }));
    },
    
    startTx: function(db,cb) {
        db.exec('BEGIN',addCtx((err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('transaction started');
                cb(null,'success');
            }
        }));
    },

    commitTx: function(db,cb) {
        db.exec('COMMIT',addCtx((err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('transaction committed');
                if(cb != null) cb(null,'success');
            }
        }));
    },

    rollbackTx: function(db,cb) {
        db.exec('ROLLBACK',addCtx((err, result)=>{
            if(err) {
                logErrAndCall(err,cb);
            } else {
                if(logger().isDebugEnabled()) logger().debug('transaction has been rollback');
                if(cb != null) cb(null,'success');
            }
        }));
    },

    prepareInsert: function(object, tableName) {
        let sqlCols = '';
        let sqlVals = '';
        for(let col in object) {
            if(columnsToSkip.indexOf(col) > -1 ) continue;

            if(sqlCols.length > 0) sqlCols += ', ';
            if(sqlVals.length > 0) sqlVals += ', ';
            sqlCols +=  col;


            // sqlVals += '"' + object[col] + '"';
            // let val = db_util.changeEmptyToNull(object[col]);
            if(columnsWithoutQuote.indexOf(col) > -1) sqlVals += object[col];
            else sqlVals += '"' + object[col] + '"';
        }

        let insertStr = 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
        if(logger().isDebugEnabled()) logger().debug('db insert: ' + insertStr);
        return insertStr;
    },

    prepareReplace: function(object, tableName) {
        let sqlCols = '';
        let sqlVals = '';
        for(let col in object) {
            if(columnsToSkip.indexOf(col) > -1 ) continue;

            if(sqlCols.length > 0) sqlCols += ', ';
            if(sqlVals.length > 0) sqlVals += ', ';
            sqlCols +=  col;


            // sqlVals += '"' + object[col] + '"';
            // let val = db_util.changeEmptyToNull(object[col]);
            if(columnsWithoutQuote.indexOf(col) > -1) sqlVals += object[col];
            else sqlVals += '"' + object[col] + '"';
        }

        let insertStr = 'REPLACE INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
        if(logger().isDebugEnabled()) logger().debug('db replace: ' + insertStr);
        return insertStr;
    },

    // BEWARE UPDATING WORK_ORDER_HIST TABLE ...
    prepareUpdate: function(idObj, object, tableName) {
        let updateStr = '';
        for(let col in object) {
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

        let idStr = '';
        for(let idKey in idObj) {
            if(idStr.length > 0) idStr += ' AND ';
            idStr += idKey + ' = ' + idObj[idKey];
        }        

        updateStr = 'UPDATE ' + tableName + ' SET ' + updateStr + ' WHERE ' + idStr;
        if(logger().isDebugEnabled()) logger().debug('db update: ' + updateStr);
        return updateStr;
    },
    
    prepareDelete: function(idObj, tableName) {

        let deleteStr = '';
        for(let idKey in idObj) {
            if(deleteStr.length > 0) deleteStr += ' AND ';
            deleteStr += idKey + ' = ' + idObj[idKey];
        }
        
        deleteStr = 'DELETE FROM ' + tableName + ' WHERE ' + deleteStr;
        if(logger().isDebugEnabled()) logger().debug('db delete: ' + deleteStr);
        return deleteStr;
    },

    prepareFilters: function(params,queryFilters) {
        if(params == null || Object.getOwnPropertyNames(params).length == 0) {
            return "";
        }
        
        let filterText = " WHERE ";
        for(let filter in queryFilters) {
            if(params[filter]) {
                if(filterText.length > 7) filterText += " AND ";
                
                let obj = {};
                obj[filter] = params[filter];
                filterText += sprintf(queryFilters[filter], obj);
            }    
        }  
        return filterText;
    },
    
    prepareFiltersByInsertion: function(query,params,queryFilters) {
        let filterInserts = {};
        for(let filter in queryFilters) {
            logger().debug('filter ' + filter );
            let filterVal = '';
            if(params[filter]) {
                if(typeof params[filter] === 'string' && params[filter].indexOf(';') >= 0) {
                    logger().warn('skipping suspicious parameter ' + params[filter]);
                    continue;
                }
                let obj = {};
                obj[filter] = params[filter];
                filterVal = sprintf(queryFilters[filter], obj);
                logger().debug('filter val ' + filterVal );
            }
            filterInserts[filter] = filterVal;
        }

        if(logger().isDebugEnabled()) logger().debug('filterInserts: ' + JSON.stringify(filterInserts));
        let rv = sprintf(query,filterInserts);
        return rv;
    },

    changeEmptyStringToNull: function(sqlValue) {
        if(typeof sqlValue === 'string') 
            return (sqlValue.length > 0) ? sqlValue : null; 
        else 
            return sqlValue;
    },
    
    getNextSeq: function(seqName, cb) {
    
        let db = db_util.getDatabase();
        let insertStat = db.prepare(insertSeq);
        let seqQueryStat = db.prepare(querySeq);
        
        let rowid;
    
        let calls = [];
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
			let ids = [];
			rows.forEach(function(row){
				ids.push(row.ID);
			});
			cb(ids);
		});
	}
};

module.exports = db_util;
