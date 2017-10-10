'use strict';

var util = require('util');
var mapper = require('./mapper');
var workTypes_db = require('./db/workTypes_db');

var workTypes = {
    
     readAll: function(req,res) {
        
        workTypes_db.readAll(function(err, workTypeRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var workTypes = mapper.mapList(mapper.workType.mapToJson, workTypeRows);            
            res.json(workTypes);
        });
    },
    
    read: function(req, res) {
        
        workTypes_db.read(req.params.id, function(err, workTypeRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(workTypeRow) {
                var workType = mapper.workType.mapToJson(workTypeRow);
                res.json(workType);
            } else {
                res.status(404).end();
            }
        });
    },
        
    update: function(req, res) {
        // res.status(501).end();
        var workTypeId = req.params.id;
        var workTypeSql = mapper.workType.mapToSql(req.body);
        workTypes_db.update(workTypeId, workTypeSql,function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { updated: result };
            if(result == 1) res.status(200);
            else res.status(404);
            res.json(rv);
        });

    },
    
    create: function(req, res) {
        // res.status(501).end();
        var workTypeSql = mapper.workType.mapToSql(req.body);
        workTypes_db.create(workTypeSql, function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { created: result }
            if(result) res.status(201).json(rv);
            else res.status(404).end();
        });
    }
};

module.exports = workTypes;