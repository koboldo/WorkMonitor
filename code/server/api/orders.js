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
        
    update: function(req, resp) {
        var orderId = req.params.id;
        var orderExtId = req.params.extId;
        var re = filterOrderPrice(req.context, req.body, true);
        console.log(JSON.stringify(re));
        var orderSql = mapper.order.mapToSql(re);
        console.log(JSON.stringify(orderSql));
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

        if(!req.query.ids) {
            resp.status(400).json({status: 'error', message: 'id list cannot be empty'});
            return;
        } else {
            ids = req.query.ids.split(',');
            for( let id in ids) {
                if(isNaN(parseInt(id))) {
                    resp.status(400).json({status: 'error', message: 'id ' + id + ' list malformed'});
                    return;
                }
            }
        }
        console.log('ids ' +  ids.join('|'));
        orders_db.getOrdersForProtocol(ids.join(','),function(err, protocolRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
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