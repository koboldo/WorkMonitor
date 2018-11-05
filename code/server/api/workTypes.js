/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const workTypes_db = require('./db/workTypes_db');
const addCtx = require('./logger').addCtx;

const workTypes = {
    
     readAll: function(req,res) {
        
        workTypes_db.readAll(addCtx(function(err, workTypeRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const workTypes = mapper.mapList(mapper.workType.mapToJson, workTypeRows);            
            res.json(workTypes);
        }));
    },
    
    read: function(req, res) {
        
        workTypes_db.read(req.params.id, addCtx(function(err, workTypeRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(workTypeRow) {
                const workType = mapper.workType.mapToJson(workTypeRow);
                res.json(workType);
            } else {
                res.status(404).end();
            }
        }));
    },
        
    update: function(req, res) {
        // res.status(501).end();
        const workTypeId = req.params.id;
        const workTypeSql = mapper.workType.mapToSql(req.body);
        workTypes_db.update(workTypeId, workTypeSql,addCtx(function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = { updated: result };
            if(result == 1) res.status(200);
            else res.status(404);
            res.json(rv);
        }));

    },
    
    create: function(req, res) {
        // res.status(501).end();
        const workTypeSql = mapper.workType.mapToSql(req.body);
        workTypes_db.create(workTypeSql, addCtx(function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = { created: result };
            if(result) res.status(201).json(rv);
            else res.status(404).end();
        }));
    }
};

module.exports = workTypes;