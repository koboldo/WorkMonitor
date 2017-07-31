'use strict';

var sqlite3 = require('sqlite3');
var util = require('util');
var local_util = require('../local_util');

var db = new sqlite3.Database('./work-monitor.db');
var logger = require('../../logger').getLogger('monitor'); 

var db_util = {
    
    performInsert: function(object, tableName, maxIdQuery, cb) {
        db.run('BEGIN', function(err,result){
            if(err) return local_util.logErrAndCall(err,cb);
            
            var idQuery = maxIdQuery;
            if(idQuery == null) {
                idQuery = 'SELECT MAX(ID) AS MAX_ID FROM ' + tableName;
            } 

            var stat = db.prepare(idQuery);
            stat.get(function(err,row){
                // console.log(util.inspect(err));  
                // console.log(util.inspect(row));  
                if(err) return local_util.logErrAndCall(err,cb);
                
                var newId = row.MAX_ID + 1;
                
                var statementStr = db_util.prepareInsert(newId, object, tableName);         
                db.run(statementStr,function(err, result){
                    if(err){
                        db.run('ROLLBACK');
                        return local_util.logErrAndCall(err,cb);
                    }
                    db.run('COMMIT',function(err,result) {
                        if(err) {
                            local_util.logErrAndCall(err,cb)
                        } else {
                            cb(null, newId);
                        }
                    });
                });
            });
            stat.finalize();
        });        
    },
    
    performUpdate: function(objectId, object, tableName, cb) {
        
        var selectStr = 'SELECT ID FROM ' + tableName + ' WHERE ID = ' + objectId;
        
        var updateStr = db_util.prepareUpdate(objectId, object, tableName); 
        
        db.run('BEGIN', function(err,result){
            if(err) {
                return logErrAndCall(err,cb);
            }
            
            var selectStat = db.prepare(selectStr);
            selectStat.get(function(err, row) {
                if(err) {
                    db.run('ROLLBACK')
                    return logErrAndCall(err,cb);
                }
                
                if(row) {
                    db.run(updateStr,function(err,result) {
                        if(err) {
                            db.run('ROLLBACK');
                            return logErrAndCall(err,cb);
                        }

                        db.run('COMMIT',function(err,result) {
                            if(err) {

                                logErrAndCall(err,cb);
                            } else {
                                cb(null,1);
                            }
                        });
                    });
                } else {
                    db.run('END');
                    cb(null,0);
                }
            });
            selectStat.finalize();
        });
    },
    
    prepareInsert: function(objectId, object, tableName) {
        var sqlCols = 'ID';
        var sqlVals = '' + objectId;
        for(var col in object) {
            sqlCols += ', ' + col;
            sqlVals += ', "' + object[col] + '"';
        }

        return 'INSERT INTO ' + tableName + ' (' + sqlCols + ') VALUES (' + sqlVals + ')';
    },
    
    prepareUpdate: function(objectId, object, tableName) {
        var updateStr = '';
        for(var col in object) {
            if(col == 'ID') continue;
            
            if(updateStr.length > 0) {
                updateStr += ', ';
            }
            updateStr += col + '="' + object[col] + '"';
        }
    
        return 'UPDATE ' + tableName + ' SET ' + updateStr + ' WHERE ID = ' + objectId; 
    }
};

module.exports = db_util;
