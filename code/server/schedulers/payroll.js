/* jshint node: true, esversion: 6 */
'use strict';

const cls = require('continuation-local-storage');
const ctx = cls.createNamespace('ctx');
const schedule = require('node-schedule');
const moment = require('moment');

const logger = require('../api/logger').logger;
const addCtx = require('../api/logger').addCtx;
const payroll_db = require('../api/db/payroll_db');

var rule = new schedule.RecurrenceRule();
rule.minute = 19;
rule.hour = [new schedule.Range(6, 23)];
rule.dayOfWeek = [new schedule.Range(1, 5)];

var scheduler = {
  schedulePayrollRecalculation: function() {

    var rpJob = schedule.scheduleJob(rule, function(fireDate){
      logger().info(`Recalculate payroll job run at ${fireDate}...`);

      const params = {};
      params.overTimeFactor = 1;
      params.periodDate = moment().format('YYYY-MM-DD');
      params.personId = "0";
      params.modifierId = 277;

      logger().info(`Recalculating payroll with params ${JSON.stringify(params)}...`);

      payroll_db.update(params, addCtx(function(err, result){
        if(err) {
          logger().error(`Cannot recalculate payroll due to ${err}`);
          return;
        }
        if(result > 0) logger().info(`Updated payroll ${result} records`);
        else logger().error(`Updated payroll ${result} records`);

      }));

    });

  }
};


module.exports = scheduler;