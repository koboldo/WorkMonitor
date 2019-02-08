/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const orders_db = require('./db/orders_db');
const prepareProtocol = require('./local_util').prepareProtocol;
const cls = require('continuation-local-storage');
// const logger = require('./logger').getLogger('monitor'); 
const logger = require('./logger').logger; 
const addCtx = require('./logger').addCtx;

const orders = {
    
    readAll: function(req,resp) {
    	if(req.query.ids) {
    		let ids = null;
    		if(req.query.ids) {
                if(logger().isDebugEnabled()) logger().debug('checking ids');
                
                ids = req.query.ids.split(',');
                for(let id in ids) {
                    if(isNaN(parseInt(id))) {
                        resp.status(400).json({status: 'error', message: 'id ' + id + ' list malformed'});
                        return;
                    }
                }
                ids = ids.join(',');
            }
    		
    		orders_db.readByIds(ids, addCtx(function(err, orderRows) {
                if(err) {
                    resp.status(500).json({status:'error', message: 'request processing failed'});
                    return;
                }
                
                let orders = mapper.mapList(mapper.order.mapToJson, orderRows);
                orders.list.forEach((order) => {
                    mapOrderItems(order);
                    filterOrderPrice(req.context, order);
                });
                
                resp.json(orders);
            }));
    	} else {
    		orders_db.readAll(req.query, addCtx(function(err, orderRows){
	            if(err) {
	                resp.status(500).json({status:'error', message: 'request processing failed'});
	                return;
	            }
	            
	            let orders = mapper.mapList(mapper.order.mapToJson, orderRows);
	            orders.list.forEach((order) => {
	                mapOrderItems(order);
	                filterOrderPrice(req.context, order);
	            });
	            
	            resp.json(orders);
	        }));
    	}
    },
    
    read: function(req, resp) {
        const orderId = req.params.id;
        const orderExtId = req.params.extId;        
        orders_db.read(orderId, orderExtId, addCtx(function(err, orderRow){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(orderRow) {
                let order = mapper.order.mapToJson(orderRow);
                mapOrderItems(order);
                filterOrderPrice(req.context, order);
                resp.json(order);
            } else {
                resp.status(404).end();
            }
        }));
    },
    
    readHistory: function(req, resp){
        const orderId = req.params.id;
        orders_db.readHistory(orderId,addCtx(function(err,histRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const orders = mapper.mapList(mapper.order.mapToJson, histRows);
            orders.list.forEach((order) => {
                filterOrderPrice(req.context, order);
            });
            resp.json(orders);            
        }));
    },

    update: function(req, resp) {
        req.body.modifiedBy = req.context.id;
        delete req.body.isFromPool;
        
        const orderId = req.params.id;
        const orderExtId = req.params.extId;
        const re = filterOrderPrice(req.context, req.body, true);
        const orderSql = mapper.order.mapToSql(re);

        orders_db.update(orderId, orderExtId, orderSql,addCtx(function(err, result){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = { updated: result };
            if(result > 0) resp.status(200);
            else resp.status(404);
            resp.json(rv);
        }));
    },
    
    create: function(req, resp) {
        
        if(!req.body.typeCode || !req.body.complexityCode || !req.body.ventureId) {
            resp.status(400).json({status:'error', message: 'missing parameters'});
            return;
        }

        req.body.modifiedBy = req.context.id;
        
        const orderSql = mapper.order.mapToSql(req.body);
        orders_db.create(orderSql, addCtx(function(err,result) {
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = { created: result };
            if(result) resp.status(201).json(rv);
            else resp.status(404).end();
        }));
    },
    
    prepareProtocol: function(req, resp) {

        let ids = null;
        let protocolNo = null;
        
        if(!req.query.ids && !req.query.protocolNo) {
            resp.status(400).json({status: 'error', message: 'canot prepare report without ids'});
            return;
        } else {
            if(req.query.ids) {
                if(logger().isDebugEnabled()) logger().debug('checking ids');
                
                ids = req.query.ids.split(',');
                for( let id in ids) {
                    if(isNaN(parseInt(id))) {
                        resp.status(400).json({status: 'error', message: 'id ' + id + ' list malformed'});
                        return;
                    }
                }
                ids = ids.join(',');
            }
            protocolNo = req.query.protocolNo;
        }

        orders_db.prepareOrdersForProtocol(ids,protocolNo,addCtx(function(err, protocol){
            if(err) {
                if(err.type == 'custom') return resp.status(500).json({status:'error', message: err.message});
                else return resp.status(500).json({status:'error', message: 'request processing failed'});
            }
            
            const protocolNo = protocol[0];
            const protocolRows = protocol[1];
            if(protocolRows.length == 0) {
                return resp.status(404).json({status:'error', message: 'nie znaleziono zamówień'});
            }
            // prepareProtocol(protocolRows,resp);
            let fileName = protocolNo.replace(/[\[\]\*\?\:\/\\]/g,'-').toUpperCase() +'.xlsx';
            prepareProtocol(protocolRows,function(fileContent){
                resp.json({ file: fileContent, name: fileName});
            });
        }));
    }
};

function mapOrderItems(order) {
    const mappedItems = [];
    order.relatedItems.forEach((relatedItem) => {
        const mappedItem = mapper.relatedItem.mapToJson(relatedItem);
        mappedItems.push(mappedItem);
    });
    order.relatedItems = mappedItems;
};

function filterOrderPrice(context, order, doRemove = false) {
    if(order.typeCode == 'OT' && context.role != 'PR')
        if(doRemove == true) delete order.price;
        else order.price = -13;
    return order;
};

module.exports = orders;