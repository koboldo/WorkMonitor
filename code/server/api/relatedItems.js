/* jshint node: true */
'use strict';

var util = require('util');
var mapper = require('./mapper');
var relatedItems_db = require('./db/relatedItems_db');

var relatedItems = {
    read: function(req, res) {
        relatedItems_db.read(req.params.id, function(err, itemRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(itemRow) {
                var item = mapper.relatedItem.mapToJson(itemRow);
                res.json(item);
            } else {
                res.status(404).end();
            }
        });
    },
    
    readAll: function(req, res) {
    	relatedItems_db.readAll(function(err, itemRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var orders = mapper.mapList(mapper.relatedItem.mapToJson, itemRows);
            res.json(orders);
        });
    },

    create: function(req, res) {

        var itemSql = mapper.relatedItem.mapToSql(req.body);
        relatedItems_db.create(itemSql, function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            var rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        });
    },

    update: function(req, res) {
        
        var itemId = req.params.id;
        var relatedItemSql = mapper.relatedItem.mapToSql(req.body);

        relatedItems_db.update(itemId, relatedItemSql,function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = {};
            if(result == 1) {
                rv.updated = result;
                res.status(200);
            } else {
                rv.updated = 0;
                res.status(404);
            } 
            res.json(rv);
        });
    }
};

module.exports = relatedItems;