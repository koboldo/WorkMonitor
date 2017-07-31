'use strict';

var util = require('util');
var mapper = require('./mapper');
var workTypes_db = require('./db/workTypes_db');

var workTypes = {
    
    read: function(req, res) {
        
        workTypes_db.read(req.params.id, function(err, workTypeRow){
            if(err) {
                res.status(500).send({status:'error', message: err});
                return;
            }
            
            if(workTypeRow) {
                var order = mapper.workType.mapToJson(workTypeRow);
                res.send(order);
            } else {
                res.status(404).end();
            }
        });
    },
        
    update: function(req, res) {
        res.status(501).end();

    },
    
    create: function(req, res) {
        res.status(501).end();
    }
};

module.exports = workTypes;