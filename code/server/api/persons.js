'use strict';

var util = require('util');
var mapper = require('./mapper');
var persons_db = require('./db/persons_db');

var persons = {
    
     readAll: function(req,res) {
        
        persons_db.readAll(function(err, personRows){
            if(err) {
                res.status(500).send({status:'error', message: 'request processing failed'});
                return;
            }
            
            var persons = mapper.mapList(mapper.person.mapToJson, personRows);
            res.send(persons);
        });
    },
    
    read: function(req, res) {
        
        persons_db.read(req.params.id, function(err, personRow){
            if(err) {
                res.status(500).send({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(personRow) {
                var person = mapper.person.mapToJson(personRow);
                res.send(person);
            } else {
                res.status(404).end();
            }
        });
    },
    
    update: function(req, res) {
        
        var personId = req.params.id;
        var personSql = mapper.person.mapToSql(req.body);

        persons_db.update(personId, personSql,function(err, result){
            if(err) {
                res.status(500).send({status:'error', message: 'request processing failed'});
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
            res.send(rv);
        });
    },
    
    create: function(req, res) {
    
        var personSql = mapper.person.mapToSql(req.body);
        persons_db.create(personSql, function(err,result) {
            if(err) {
                res.status(500).send({status:'error', message: 'request processing failed'});
                return;
            }

            var rv = { created: result }
            if(result != null) res.send(rv);
            else res.status(404).end();
        });
    }
};

module.exports = persons;