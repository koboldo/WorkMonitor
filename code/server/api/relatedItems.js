/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const relatedItems_db = require('./db/relatedItems_db');
const addCtx = require('./logger').addCtx;

const relatedItems = {
    read: function(req, res) {
        relatedItems_db.read(req.params.id, addCtx(function(err, itemRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(itemRow) {
                const item = mapper.relatedItem.mapToJson(itemRow);
                res.json(item);
            } else {
                res.status(404).end();
            }
        }));
    },
    
    readAll: function(req, res) {
    	relatedItems_db.readAll(addCtx(function(err, itemRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const orders = mapper.mapList(mapper.relatedItem.mapToJson, itemRows);
            res.json(orders);
        }));
    },

    create: function(req, res) {

        const itemSql = mapper.relatedItem.mapToSql(req.body);
        relatedItems_db.create(itemSql, addCtx(function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        }));
    },

    update: function(req, res) {
        
        const itemId = req.params.id;
        const relatedItemSql = mapper.relatedItem.mapToSql(req.body);

        relatedItems_db.update(itemId, relatedItemSql,addCtx(function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = {};
            if(result == 1) {
                rv.updated = result;
                res.status(200);
            } else {
                rv.updated = 0;
                res.status(404);
            } 
            res.json(rv);
        }));
    }
};

module.exports = relatedItems;