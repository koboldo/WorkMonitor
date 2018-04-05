/* jshint node: true, esversion: 6 */
'use strict';

var moment = require('moment');
var mapper = require('./mapper');
var payroll_db = require('./db/payroll_db');

var payrolls = {

    read: function(req, resp){

        var isBoss = ([].concat(req.context.role).indexOf('PR') > -1);

        var params = {};

        if(req.query.history == 'Y' && (req.query.periodDate || req.query.overTimeFactor || req.query.approved)) {
            resp.status(400).json({status:'error', message: 'wykluczające się parametry'});
            return;
        }

        if(req.query.approved && isBoss) params.approved = req.query.approved;
        else params.approved = "N";

        if(req.query.periodDate && isBoss) params.periodDate = req.query.periodDate;
        else params.periodDate = moment().format('YYYY-MM-DD');

        if(req.query.overTimeFactor && isBoss) params.overTimeFactor = req.query.overTimeFactor;
        else params.overTimeFactor = 1;

        if(req.query.history && req.query.history == "Y") {
            params.history = req.query.history;
            params.periodDate = moment().add(-1,'month').format('YYYY-MM-DD');
        } else params.history = "N";

        try {
            params.overTimeFactor = parseFloat(params.overTimeFactor);
        } catch (error) {
            resp.status(400).json({status:'error', message: 'zły współczynnik nadgodzin'});
            return;
        }

        if(['Y','N'].indexOf(params.approved) < 0) {
            resp.status(400).json({status:'error', message: 'zły współczynnik akceptacji'});
            return;
        }

        if(['Y','N'].indexOf(params.history) < 0) {
            resp.status(400).json({status:'error', message: 'zły parametr historii'});
            return;
        }

        if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(params.periodDate)) {
            resp.status(400).json({status:'error', message: 'zła data okresu'});
            return;
        }

        if(req.query.personId && isBoss) params.personId = req.query.personId;
        else if(!req.query.personId && isBoss) params.personId = "0";
        else params.personId = req.context.id;

        params.modifierId = req.context.id;

        payroll_db.read(params, function(err, payrollRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var payroll = mapper.mapList(mapper.payroll.mapToJson,payrollRows);
            filterPayrollFields(req.context,payroll);
            resp.json(payroll); 
        });
    }
};

function filterPayrollFields(context, payroll) {
    var currPayroll = null;
    payroll.list.filter((p)=>p.personId == context.id).forEach((p)=>currPayroll = p);
    payroll.list.forEach((p)=>{
        if(![].concat(context.role).some((p)=>['PR','OP'].indexOf(p)>=0) && (currPayroll == null || 
            (currPayroll.rankCode != 'SEN' && currPayroll.isFromPool != 'Y' )))  {
            delete p.budget;
            delete p.poolRate;
        }
    });
};

module.exports = payrolls;