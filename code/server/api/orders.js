/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var dateformat = require('dateformat');
var mapper = require('./mapper');
var orders_db = require('./db/orders_db');
var prepareProtocol = require('./local_util').prepareProtocol;
var orders = {
    
    readAll: function(req,resp) {
        
        orders_db.readAll(req.query, function(err, orderRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var orders = mapper.mapList(mapper.order.mapToJson, orderRows);
            orders.list.forEach((order) => {
                mapOrderItems(order);
                filterOrderPrice(req.context, order);
            });
            resp.json(orders);
        });
    },
    
    read: function(req, resp) {
        var orderId = req.params.id;
        var orderExtId = req.params.extId;        
        orders_db.read(orderId, orderExtId, function(err, orderRow){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(orderRow) {
                var order = mapper.order.mapToJson(orderRow);
                mapOrderItems(order);
                filterOrderPrice(req.context, order);
                resp.json(order);
            } else {
                resp.status(404).end();
            }
        });
    },
    
    readHistory: function(req, resp){
        var orderId = req.params.id;
        orders_db.readHistory(orderId,function(err,histRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var orders = mapper.mapList(mapper.order.mapToJson, histRows);
            orders.list.forEach((order) => {
                filterOrderPrice(req.context, order);
            });
            resp.json(orders);            
        });
    },

    update: function(req, resp) {
        var orderId = req.params.id;
        var orderExtId = req.params.extId;
        var re = filterOrderPrice(req.context, req.body, true);
        var orderSql = mapper.order.mapToSql(re);

        orders_db.update(orderId, orderExtId, orderSql,function(err, result){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { updated: result };
            if(result == 1) resp.status(200);
            else resp.status(404);
            resp.json(rv);
        });
    },
    
    create: function(req, resp) {
        var orderSql = mapper.order.mapToSql(req.body);
        orders_db.create(orderSql, function(err,result) {
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { created: result };
            if(result) resp.status(201).json(rv);
            else resp.status(404).end();
        });
    },

    calculateTotalPriceForCompleted: function(req, resp) {
        if(req.query.dateAfter == null) req.query.dateAfter = dateformat(
            new Date(new Date().getFullYear(), new Date().getMonth(),1),'yyyy-mm-dd');
        if(req.query.dateBefore == null) req.query.dateBefore = dateformat(
            new Date(new Date().getFullYear(), new Date().getMonth()+1,0),'yyyy-mm-dd');

        orders_db.calculateTotalPriceForCompleted(req.query, function(err, reportRow){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var report = mapper.order.mapToJson(reportRow);
            resp.json(report);
        });
    },

    prepareProtocol: function(req, resp) {

        var ids = null;
        var protocolNo = null;

        if(!req.query.ids && !req.query.protocolNo) {
            resp.status(400).json({status: 'error', message: 'canot prepare report without ids'});
            return;
        } else {
            if(req.query.ids) {
                console.log('checking ids');
                
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
        
        orders_db.prepareOrdersForProtocol(ids,protocolNo,function(err, protocolRows){
            if(err) {
                if(err.fileName == 'custom') return resp.status(500).json({status:'error', message: err.message});
                else return resp.status(500).json({status:'error', message: 'request processing failed'});
            }
            
            if(protocolRows.length == 0) {
                return resp.status(404).json({status:'error', message: 'work orders not found'});
            }
            // prepareProtocol(protocolRows,resp);
            prepareProtocol(protocolRows,function(fileObj){
                resp.json(fileObj);
            });
        });
    }
};

function mapOrderItems(order) {
    var mappedItems = [];
    order.relatedItems.forEach((relatedItem) => {
        var mappedItem = mapper.relatedItem.mapToJson(relatedItem);
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