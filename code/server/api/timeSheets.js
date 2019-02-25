/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper');
const timeSheets_db = require('./db/timeSheets_db');
const ipGeo_db = require('./db/ipGeo_db');
const moment = require('moment');
const request = require('request');

const logErrAndCall = require('./local_util').logErrAndCall;
const parseStringToDate = require('./local_util').parseStringToDate;
const httpGet = require('./local_util').httpGet;
const addCtx = require('./logger').addCtx;
const logger = require('./logger').logger;
const asynclib = require('async');

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

		const calls = [];

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
 
        let ip = req.headers['X-Real-IP'] || '127.0.0.1';
        
        if(req.body.from == 'now' || req.body.to == 'now') { 
        	req.body.personId = req.context.id;
        	
            logger().debug('self-register, checking ip '+ip+' in GEO_ISP');
            
            calls.push(
        		function(done) {
        			ipGeo_db.readCount(ip, function(err, ipRow){
                        if(err) {
                        	logger().error('readCount err! ', err);
                        	done(err, null); 
                        }
                        if(logger().isDebugEnabled()) logger().debug('ipRow '+JSON.stringify(ipRow));
                        done(null, ipRow['COUNT']); // <- set value to passed to step 2
        			});
        		}
    		);
            
            calls.push(
        		function(ipRowCount, done) {
	                
	                if(ipRowCount > 0) {
	                	if(logger().isDebugEnabled()) logger().debug('ip: '+ip+" already registered.");
	                	done(null, false);
	                } else {
	                	async function getAndCreateIpRecord() {
	                		const url = 'http://extreme-ip-lookup.com/json/'+ip;
		                	const body = await httpGet(url, 3000);
		                	logger().debug('await '+body);
		                	let ipJson = JSON.parse(body);
		                	let ipGeo = {ip: ip, isp: ipJson.isp, org: ipJson.org, city: ipJson.city, region: ipJson.region};
		                	
		                	ipGeo_db.create(ipGeo, function(err, lastId) {
		                		if(err) {
		                			logger().debug('create '+err+' lastId:'+lastId);
		                        	done(err, null); // <- set value to passed to step 3
		                        }
		                        done(null, true); // <- set value to passed to step 3
		                	});
	                    }
	                	
	                	getAndCreateIpRecord();
	                	
	                }
	            }
    		);
        }

        const nowDateTxt = moment().format('YYYY-MM-DD HH:mm:ss');
        if(req.body.from == 'now') {
        	req.body.from = nowDateTxt;
        	req.body.fromMobileDevice = req.body.fromMobileDevice ? 'Y' : 'N';
        	req.body.fromIp = ip;
        }
        if(req.body.to == 'now') {
        	req.body.to = nowDateTxt;
        	req.body.toMobileDevice = req.body.toMobileDevice ? 'Y' : 'N';
        	req.body.toIp = ip;
        }
        if(req.body.from) req.body.workDate = req.body.from;
        else req.body.workDate = nowDateTxt;
        
        if(req.body.from && req.body.to && parseStringToDate(req.body.from).getTime() > parseStringToDate(req.body.to).getTime()) {
            res.status(400).json({status:'error', message: 'invalid values'});
            return;
        }

        const timeSheetSql = mapper.timeSheet.mapToSql(req.body);
        
        asynclib.waterfall(
                calls,
                addCtx(function(err, result) {                
                    if(err) {
                    	logger().debug('err waterfall '+err);
                    	res.status(500).json({status: 'error', message: 'request processing failed'});
                    } else {                     
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
                    }
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