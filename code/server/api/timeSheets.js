/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const timeSheets_db = require('./db/timeSheets_db');
const moment = require('moment');
const parseStringToDate = require('./local_util').parseStringToDate;
const addCtx = require('./logger').addCtx;

const timeSheets = {

    readAll: function(req, res) {

        if(!req.query.workDateBefore || !req.query.workDateAfter) {
            res.status(400).json({status:'error', message: 'missing date range'});
            return;
        }
        
        timeSheets_db.readAll(req.query, addCtx(function(err, timeSheetRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const timeSheets = mapper.mapList(mapper.timeSheet.mapToJson,timeSheetRows);
            res.json(timeSheets);
        }));
    },

	
	create: function(req, res) {

        if(!req.body.personId) {
            res.status(400).json({status:'error', message: 'request processing failed'});
            return;
        }

        if([].concat(req.context.role).indexOf('OP') < 0)  {
            delete req.body.isLeave;
            delete req.body.training;
        }  
        
        req.body.createdBy = req.context.id;
        req.body.modifiedBy = req.context.id;
 
        if(req.body.from == 'now' || req.body.to == 'now') req.body.personId = req.context.id;

        const nowDateTxt = moment().format('YYYY-MM-DD HH:mm:ss');
        if(req.body.from == 'now') req.body.from = nowDateTxt;
        if(req.body.to == 'now') req.body.to = nowDateTxt;
        if(req.body.from) req.body.workDate = req.body.from;
        else req.body.workDate = nowDateTxt;
        
        if(req.body.from && req.body.to && parseStringToDate(req.body.from).getTime() > parseStringToDate(req.body.to).getTime()) {
            res.status(400).json({status:'error', message: 'invalid values'});
            return;
        }

        const timeSheetSql = mapper.timeSheet.mapToSql(req.body);
        timeSheets_db.create(timeSheetSql, addCtx(function(err,updated,row) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const ts = mapper.timeSheet.mapToJson(row);
            const op = (updated) ? 'updated' : 'created';
            const rv = {};
            rv[op] = 1;
            rv.timesheet = ts;
            res.status(201).json(rv);
        }));
    },

    createLeave: function(req,res) {

        if(!req.body.to || !req.body.from || parseStringToDate(req.body.from).getTime() > parseStringToDate(req.body.to).getTime()) {
            return res.status(400).json({status:'error', message: 'invalid values'});
        }
        
        req.body.createdBy = req.context.id;
        const timeSheetSql = mapper.timeSheet.mapToSql(req.body);
        timeSheets_db.createLeave(timeSheetSql,addCtx(function(err, timeSheetRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }

            const rv = {};
            rv.created = 1;
            rv.timesheet = mapper.mapList(mapper.timeSheet.mapToJson,timeSheetRows).list;
            res.status(201).json(rv);
        }));
    },

    readStats: function(req,res) {

        if(!req.query.periodDate) {
            req.query.periodDate = moment().format("YYYY-MM-DD");
        } else if(!moment(req.query.periodDate, 'YYYY-MM-DD', true).isValid()) {
            res.status(400).json({status:'error', message: 'incorrect period date'});
            return;
        }
        
        if(!req.query.personId || req.query.personId == '') {
            req.query.personId = "0";
        }
        
        timeSheets_db.readStats(req.query, addCtx(function(err, timestatRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            const timestats = mapper.mapList(mapper.timeStats.mapToJson,timestatRows);
            res.json(timestats);
        }));
    }

};

module.exports = timeSheets;