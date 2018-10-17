/* jshint node: true, esversion: 6 */
'use strict';

const util = require('util');
const local_util = require('../local_util');
const dbUtil = require('./db_util');

// const logger = require('../logger').getLogger('monitor'); 
const logger = require('../logger').logger; 
const addCtx = require('../logger').addCtx;

const queries = {
    getItem: 'SELECT ID, ITEM_NO, DESCRIPTION, ADDRESS, MD_BUILDING_TYPE, MD_CONSTRUCTION_CATEGORY, DATETIME(CREATED,"unixepoch", "localtime") AS CREATED FROM RELATED_ITEM WHERE ID = ?',
    getItems: 'SELECT ID, ITEM_NO, DESCRIPTION, ADDRESS, MD_BUILDING_TYPE, MD_CONSTRUCTION_CATEGORY, DATETIME(CREATED,"unixepoch", "localtime") AS CREATED FROM RELATED_ITEM'
};

const relatedItems_db = {
    read: function(id, cb) {
        const db = dbUtil.getDatabase();
        const getItemStat = db.prepare(queries.getItem);

        getItemStat.bind(id).get(addCtx(function(err,row){
            getItemStat.finalize();
            db.close();
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
        }));
    },
    
    readAll: function(cb) {
        const db = dbUtil.getDatabase();

        if(logger().isDebugEnabled()) logger().debug('query for getting related items: ' + queries.getItems);

        const getItemsStat = db.prepare(queries.getItems);
        getItemsStat.all(addCtx(function(err,rows) {
        	getItemsStat.finalize();
            db.close();
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,rows);
        }));

    },

    update: function(itemId, relatedItem, cb) {
        const idObj = {};
        // idObj.name = 'ID';
        // idObj.value = itemId;
        idObj.ID = itemId;
        
        if(logger().isDebugEnabled()) logger().debug('update related item of id ' + itemId + ' with object: ' + util.inspect(relatedItem));
        
        dbUtil.performUpdate(idObj, relatedItem, 'RELATED_ITEM', addCtx(function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        }));
    },

    create: function(relatedItem, cb) {
        if(logger().isDebugEnabled()) logger().debug('insert related item with object: ' + util.inspect(relatedItem));
        
        dbUtil.performInsert(relatedItem, 'RELATED_ITEM', null, addCtx(function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        }));
    }
};

module.exports = relatedItems_db;