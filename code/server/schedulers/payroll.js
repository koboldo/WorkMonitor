/* jshint node: true, esversion: 6 */
'use strict';

const cls = require('continuation-local-storage');
const ctx = cls.createNamespace('ctx');
const schedule = require('node-schedule');
const moment = require('moment');

const logger = require('../api/logger').logger;
const addCtx = require('../api/logger').addCtx;
const payroll_db = require('../api/db/payroll_db');
const prometheus = require('../monitoring/prometheus');

var recalculationRule = new schedule.RecurrenceRule();
recalculationRule.minute = 19;
recalculationRule.hour = [new schedule.Range(6, 23)];
recalculationRule.dayOfWeek = [new schedule.Range(1, 5)];

var approvalRule = new schedule.RecurrenceRule();
approvalRule.minute = 1;
approvalRule.hour = 23;
approvalRule.month = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
approvalRule.date = [3, 7]; //day number, approved by Sebastian

const promClient = prometheus.getPromClient();
const counter = new promClient.Counter({
  name: 'botapp_payroll_scheduler',
  help: 'botapp_payroll_scheduler',
  labelNames: ['result']
});

var scheduler = {

  schedulePayrollRecalculation: function () {

    var rpJob = schedule.scheduleJob(recalculationRule, function (fireDate) {
      logger().info(`Recalculate payroll job run at ${fireDate}...`);

      const params = {};
      params.overTimeFactor = 1;
      params.periodDate = moment().format('YYYY-MM-DD');
      params.personId = "0";
      params.modifierId = 277;

      logger().info(`Recalculating payroll with params ${JSON.stringify(params)}...`);

      payroll_db.update(params, addCtx(function (err, result) {
        if (err) {
          logger().error(`Cannot recalculate payroll due to ${err}`);
          counter.inc({result: 'ERROR'}, 0);
          return;
        }

        if (result > 0) {
          counter.inc({result: 'OK'}, result);
          logger().info(`Updated payroll after recalculation: ${result} records`);
        } else {
          counter.inc({result: 'ERROR'}, result);
          logger().error(`Updated payroll after recalculation: ${result} records`);
        }

      }));

    });
  },

  schedulePayrollApproval: function() {

    var apJob = schedule.scheduleJob(approvalRule, function(fireDate){
      logger().info(`Approving payroll job run at ${fireDate}...`);

      const params = {};
      params.overTimeFactor = 1;
      params.periodDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
      params.personId = "0";
      params.approved = "Y";
      params.modifierId = 277;

      logger().info(`Approving payroll with params ${JSON.stringify(params)}...`);

      payroll_db.update(params, addCtx(function(err, result){
        if(err) {
          logger().error(`Cannot approve payroll due to ${err}`);
          counter.inc({ result: 'ERROR'}, 0);
          return;
        }

        if(result > 0) {
          counter.inc({ result: 'OK'}, result);
          logger().info(`Updated payroll after approval: ${result} records`);
        } else {
          counter.inc({ result: 'ERROR'}, result);
          logger().error(`Updated payroll after approval: ${result} records`);
        }

      }));

    });

  }
};

module.exports = scheduler;