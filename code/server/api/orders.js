'use strict';

var util = require('util');
var mapper = require('./mapper');
var orders_db = require('./db/orders_db');

var orders = {
    
    readAll: function(req,res) {
        
        orders_db.readAll(null, function(err, orderRows){
            if(err) {
                res.status(500).send({status:'error', message: err});
                return;
            }
            
            var orders = mapper.mapList(mapper.order.mapToJson, orderRows);            
            res.send(orders);
        });
    },
    
    read: function(req, res) {
        
        orders_db.read(req.params.id, function(err, orderRow){
            if(err) {
                res.status(500).send({status:'error', message: err});
                return;
            }
            
            if(orderRow) {
                var order = mapper.order.mapToJson(orderRow);
                res.send(order);
            } else {
                res.status(404).end();
            }
        });
    },
        
    update: function(req, res) {
        
        // var orderId = req.params.id;
        // var orderSql = mapper.order.mapToSql(req.body);
        // orders_db.update(orderId, orderSql,function(err, result){
            // if(err) {
                // res.status(500).send({status:'error', message: err});
                // return;
            // }
            // var rv = { updated: result };
            // if(result == 1) res.status(200);
            // else res.status(404);
            // res.send(rv);
        // });
    },
    
    create: function(req, res) {
    
        // var orderSql = mapper.order.mapToSql(req.body);
        // orders_db.create(orderSql, function(err,result) {
            // if(err) {
                // res.status(500).send({status:'error', message: err});
                // return;
            // }
            // var rv = { updated: result }
            // if(result) res.send(rv);
            // else res.status(404).end();
        // });
    }
};

module.exports = orders;