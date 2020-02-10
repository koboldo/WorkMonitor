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

var currentPayrollRecalculationRule = new schedule.RecurrenceRule();
currentPayrollRecalculationRule.minute = 19;
currentPayrollRecalculationRule.hour = [new schedule.Range(6, 23)];
currentPayrollRecalculationRule.dayOfWeek = [new schedule.Range(1, 5)];

var prevPayrollRecalculationRule = new schedule.RecurrenceRule();
prevPayrollRecalculationRule.minute = 30; //lunch time
prevPayrollRecalculationRule.hour = 12;
prevPayrollRecalculationRule.month = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
prevPayrollRecalculationRule.date = [new schedule.Range(1, 7)]; //day number, approved by Sebastian

var prevPayrollApprovalRule = new schedule.RecurrenceRule();
prevPayrollApprovalRule.minute = 1;
prevPayrollApprovalRule.hour = 13;
prevPayrollApprovalRule.month = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
prevPayrollApprovalRule.date = 8; //day number, approved by Sebastian

const promClient = prometheus.getPromClient();
const counter = new promClient.Counter({
  name: 'botapp_payroll_scheduler',
  help: 'botapp_payroll_scheduler',
  labelNames: ['result']
});

var scheduler = {

  schedule: function (recurrenceRule, what, periodDate, approvedFlag) {

    var anyJob = schedule.scheduleJob(recurrenceRule, function (fireDate) {
      logger().info(`${what} payroll job run at ${fireDate}...`);

      const params = {};
      params.overTimeFactor = 1;
      params.periodDate = periodDate;
      params.personId = "0";
      params.modifierId = 277;
      if (approvedFlag) {
        params.approved = "Y";
      }

      logger().info(`${what} payroll with params ${JSON.stringify(params)}...`);

      payroll_db.update(params, addCtx(function (err, result) {
        if (err) {
          logger().error(`Cannot ${what} payroll due to ${err}`);
          counter.inc({result: 'ERROR'}, 0);
          return;
        }

        if (result > 0) {
          counter.inc({result: 'OK'}, result);
          logger().info(`Updated payroll after ${what}: ${result} records`);
        } else {
          counter.inc({result: 'ERROR'}, result);
          logger().error(`Updated payroll after ${what}: ${result} records`);
        }

      }));

    });
  },

  scheduleCurrentMonthPayrollRecalculation: function () {
    this.schedule(currentPayrollRecalculationRule, 'Recalculating current month', moment().format('YYYY-MM-DD'), false);
  },

  schedulePreviousMonthPayrollRecalculation: function() {
    this.schedule(prevPayrollRecalculationRule, 'Recalculating previous month', moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'), false);
  },

  schedulePreviousMonthPayrollApproval: function() {
    this.schedule(prevPayrollApprovalRule, 'Approving previous month', moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'), true);
  }
};

module.exports = scheduler;