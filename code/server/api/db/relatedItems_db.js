/* jshint node: true */
'use strict';

var util = require('util');
var local_util = require('../local_util');
var dbUtil = require('./db_util');

var logger = require('../logger').getLogger('monitor'); 

var queries = {
    getItem: 'SELECT ID, ITEM_NO, DESCRIPTION, ADDRESS, MD_BUILDING_TYPE, MD_CONSTRUCTION_CATEGORY, DATETIME(CREATED,"unixepoch") AS CREATED FROM RELATED_ITEM WHERE ID = ?',
    getItems: 'SELECT ID, ITEM_NO, DESCRIPTION, ADDRESS, MD_BUILDING_TYPE, MD_CONSTRUCTION_CATEGORY, DATETIME(CREATED,"unixepoch") AS CREATED FROM RELATED_ITEM'
};

var relatedItems_db = {
    read: function(id, cb) {
        var db = dbUtil.getDatabase();
        var getItemStat = db.prepare(queries.getItem);

        getItemStat.bind(id).get(function(err,row){
            getItemStat.finalize();
            db.close();
			if(err) return local_util.logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            cb(null,row);
        });
    },
    
    readAll: function(cb) {
        var db = dbUtil.getDatabase();

        if(logger.isDebugEnabled()) logger.debug('query for getting related items: ' + queries.getItems);

        var getItemsStat = db.prepare(queries.getItems);
        getItemsStat.all(function(err,rows) {
        	getItemsStat.finalize();
            db.close();
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,rows);
        });

    },

    update: function(itemId, relatedItem, cb) {
        var idObj = {};
        idObj.name = 'ID';
        idObj.value = itemId;
        
        if(logger.isDebugEnabled()) logger.debug('update related item of id ' + itemId + ' with object: ' + util.inspect(relatedItem));
        
        dbUtil.performUpdate(idObj, relatedItem, 'RELATED_ITEM', function(err,result) {
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,result);
        });
    },

    create: function(relatedItem, cb) {
        if(logger.isDebugEnabled()) logger.debug('insert related item with object: ' + util.inspect(relatedItem));
        
        dbUtil.performInsert(relatedItem, 'RELATED_ITEM', null, function(err, newId){
            if(err) return local_util.logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = relatedItems_db;