/* jshint node: true, esversion: 6 */
'use strict';

var util = require('util');
var mapper = require('./mapper');
var persons_db = require('./db/persons_db');
var moment = require('moment');
var logger = require('./logger').getLogger('monitor');

var persons = {
    
     readAll: function(req,res) {
        
        persons_db.readAll(function(err, personRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var persons = mapper.mapList(mapper.person.mapToJson, personRows);
            var personsFiltered = [];
            persons.list.forEach((person)=>{
                personsFiltered.push(filterPersonFields(req.context,person));
            });
            res.json({list:personsFiltered});
        });
    },
    
    read: function(req, res) {
        persons_db.read(req.params.id, function(err, personRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(personRow) {
                var person = mapper.person.mapToJson(personRow);
                var personFiltered = filterPersonFields(req.context,person);
                res.json(personFiltered);
            } else {
                res.status(404).end();
            }
        });
    },
    
    readOrders: function(req,res) {

        if(req.query.dateAfter == null) 
            req.query.dateAfter = moment().startOf('month').format('YYYY-MM-DD');

        if(req.query.dateBefore == null) 
            req.query.dateBefore = moment().startOf('month').add(1,'month').add(-1,'second').format('YYYY-MM-DD');

        persons_db.readOrders(req.query, function(err, personRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var persons = mapper.mapList(mapper.person.mapToJson, personRows);
            persons.list.forEach((person) => {
                var orders = mapper.mapList(mapper.order.mapToJson, person.workOrders);
                person.workOrders = orders.list;
            });
            res.json(persons);
        });
    },

    update: function(req, res) {
        
        var personId = req.params.id;
        var pe = filterPersonFields(req.context, req.body);
        pe.modifiedBy = req.context.id;
        var personSql = mapper.person.mapToSql(pe);

        persons_db.update(personId, personSql,function(err, result){
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
    },
    
    create: function(req, res) {
    
        var personSql = mapper.person.mapToSql(req.body);
        personSql.PASSWORD = 'justASimpleText';
        
        persons_db.create(personSql, function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            var rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        });
    },

    addOrder: function(req, res) {
        
        var orderRelation = {};
        orderRelation.PERSON_ID = req.params.pid;
        orderRelation.WO_ID = req.params.oid;

        var detach = (req.query.detach != null) ? JSON.parse(req.query.detach) : false;

        persons_db.addOrder(orderRelation, detach, function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            var rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        });
    },

    removeOrder: function(req, res) {
        
        var orderRelation = {};
        orderRelation.PERSON_ID = req.params.pid;
        orderRelation.WO_ID = req.params.oid;

        persons_db.deleteOrder(orderRelation,function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            var rv = { deleted: result };
            if(result != null) res.status(200).json(rv);
            else res.status(404).end();
        });
    },
    
    readHistory: function(req, res) {
    	logger.info("reading history...");
    	
    	//RODO
    	if([].concat(req.context.role).indexOf('PR') < 0) {
    		res.status(403).json({status:'error', message: 'request processing failed, history'});
    		return;
    	} 
    	
        var personId = req.params.id;
        logger.debug("reading history for "+personId);
        
        persons_db.readHistory(personId,function(err,histPersonRows){
        	if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            var persons = mapper.mapList(mapper.person.mapToJson, histPersonRows);
            var personsFiltered = [];
            persons.list.forEach((person)=>{
                personsFiltered.push(filterPersonFields(req.context,person));
            });
            res.json({list:personsFiltered});           
        });
    }
};

function filterPersonFields(context, person) {
    if([].concat(context.role).indexOf('PR') < 0)  {
        delete person.agreementCode;
        delete person.projectFactor;
        delete person.salary;
        delete person.salaryRate;
        delete person.leaveRate;
    }
    return person;
};

module.exports = persons;