/* jshint node: true, esversion: 6 */
'use strict';

const dbUtil = require('./db_util');
const logErrAndCall = require('../local_util').logErrAndCall;
const addCtx = require('../logger').addCtx;

const queries = {
	getWorkTypes: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, DESCRIPTION, PRICE, IS_FROM_POOL FROM WORK_TYPE',
	getWorkType: 'SELECT ID, TYPE_CODE, OFFICE_CODE, COMPLEXITY_CODE, COMPLEXITY, COMPLEXITY, DESCRIPTION, PRICE, IS_FROM_POOL FROM WORK_TYPE WHERE ID = ?',
};

const workTypes_db = {
       
    readAll: function(cb) {
        const db = dbUtil.getDatabase();
        const getWorkTypesStat = db.prepare(queries.getWorkTypes);
        getWorkTypesStat.all(addCtx(function(err,rows) {
            getWorkTypesStat.finalize();
            db.close();
            if(err) return logErrAndCall(err,cb);
            cb(null,rows);
        }));
    },
    
    read: function(workTypeId, cb) {
        //TODO: parameter validation
        const db = dbUtil.getDatabase();
        const getWorkTypeStat = db.prepare(queries.getWorkType);
		getWorkTypeStat.bind(workTypeId).get(addCtx(function(err, row) {
            getWorkTypeStat.finalize();
            db.close();
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
            
		}));
    },
    
    update: function(workTypeId, workType, cb) {
        const idObj = {};
        // idObj.name = 'ID';
        // idObj.value = workTypeId;
        idObj.ID = workTypeId;
        
        dbUtil.performUpdate(idObj, workType, 'WORK_TYPE', addCtx(function(err,result) {
            if(err) return logErrAndCall(err,cb);
            cb(null,result);
        }));
    },
    
    create: function(workType, cb) {
        dbUtil.performInsert(workType, 'WORK_TYPE', null, addCtx(function(err, newId){
            if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        }));
    }
};

module.exports = workTypes_db;
