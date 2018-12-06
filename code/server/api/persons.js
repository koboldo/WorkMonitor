/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const moment = require('moment');
const persons_db = require('./db/persons_db');
const addCtx = require('./logger').addCtx;

const persons = {
    
     readAll: function(req,res) {
        
        persons_db.readAll(addCtx(function(err, personRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const persons = mapper.mapList(mapper.person.mapToJson, personRows);
            const personsFiltered = [];
            persons.list.forEach((person)=>{
                personsFiltered.push(filterPersonFields(req.context,person));
            });
            res.json({list:personsFiltered});
        }));
    },
    
    read: function(req, res) {
        persons_db.read(req.params.id, addCtx(function(err, personRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(personRow) {
                const person = mapper.person.mapToJson(personRow);
                const personFiltered = filterPersonFields(req.context,person);
                res.json(personFiltered);
            } else {
                res.status(404).end();
            }
        }));
    },
    
    readOrders: function(req,res) {

        if(req.query.dateAfter == null) 
            req.query.dateAfter = moment().startOf('month').format('YYYY-MM-DD');

        if(req.query.dateBefore == null) 
            req.query.dateBefore = moment().startOf('month').add(1,'month').add(-1,'second').format('YYYY-MM-DD');

        persons_db.readOrders(req.query, addCtx(function(err, personRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const persons = mapper.mapList(mapper.person.mapToJson, personRows);
            persons.list.forEach((person) => {
                const orders = mapper.mapList(mapper.order.mapToJson, person.workOrders);
                person.workOrders = orders.list;
                person.roleCode = person.roleCode.trim().split(',');
            });
            res.json(persons);
        }));
    },

    update: function(req, res) {
        
        const personId = req.params.id;
        const pe = filterPersonFields(req.context, req.body);
        pe.modifiedBy = req.context.id;
        const personSql = mapper.person.mapToSql(pe);

        persons_db.update(personId, personSql,addCtx(function(err, result){
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
    },
    
    create: function(req, res) {
    
        const personSql = mapper.person.mapToSql(req.body);
        personSql.PASSWORD = 'justASimpleText';
        
        persons_db.create(personSql, addCtx(function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        }));
    },

    addOrder: function(req, res) {
        
        const orderRelation = {};
        orderRelation.PERSON_ID = req.params.pid;
        orderRelation.WO_ID = req.params.oid;

        const detach = (req.query.detach != null) ? JSON.parse(req.query.detach) : false;

        persons_db.addOrder(orderRelation, detach, addCtx(function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const rv = { created: result };
            if(result != null) res.status(201).json(rv);
            else res.status(404).end();
        }));
    },

    removeOrder: function(req, res) {
        
        const orderRelation = {};
        orderRelation.PERSON_ID = req.params.pid;
        orderRelation.WO_ID = req.params.oid;

        persons_db.deleteOrder(orderRelation,addCtx(function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const rv = { deleted: result };
            if(result != null) res.status(200).json(rv);
            else res.status(404).end();
        }));
    },
    
    readHistory: function(req, res) {
    	
    	//RODO
    	if([].concat(req.context.role).indexOf('PR') < 0) {
    		res.status(403).json({status:'error', message: 'request processing failed, history'});
    		return;
    	} 
    	
        const personId = req.params.id;
        persons_db.readHistory(personId,addCtx(function(err,histPersonRows){
        	if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const persons = mapper.mapList(mapper.person.mapToJson, histPersonRows);
            const personsFiltered = [];
            persons.list.forEach((person)=>{
                personsFiltered.push(filterPersonFields(req.context,person));
            });
            res.json({list:personsFiltered});           
        }));
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
}

module.exports = persons;