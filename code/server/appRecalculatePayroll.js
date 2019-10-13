/* jshint node: true */
'use strict';

const express = require('express');
const nanoid = require('nanoid');
const moment = require('moment');

const cls = require('continuation-local-storage');
var ctx = cls.createNamespace('ctx');

if(!process.env.WM_CONF_DIR) throw new Error('Env variable WM_CONF_DIR not set! Aborting...');

const logger = require('./api/logger').logger;
const addCtx = require('./api/logger').addCtx;
const payroll_db = require('./api/db/payroll_db');


var app = express();


logger().info('Recalculating payroll...');

const params = {};
params.overTimeFactor = 1;
params.periodDate = moment().format('YYYY-MM-DD');
params.personId = "0";
params.modifierId = 47; //TODO

logger().info(`Recalculating payroll with params ${JSON.stringify(params)}...`);

payroll_db.update(params, addCtx(function(err, result){
    if(err) {
    	logger().error(`Cannot recalculate payroll due to ${err}`);
        return;
    }
    if(result > 0) logger().info(`Updated payroll ${result} records`);
    else logger().error(`Updated payroll ${result} records`);
     
}));