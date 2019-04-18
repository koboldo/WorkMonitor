/* jshint node: true, esversion: 6 */
'use strict';

const moment = require('moment');
const mapper = require('./mapper');
const payroll_db = require('./db/payroll_db');
const addCtx = require('./logger').addCtx;

const payrolls = {

    read: function(req, resp){

        // console.log("query " + JSON.stringify(req.query));
        // console.log("params " + JSON.stringify(req.params));
        
        const isBoss = ([].concat(req.context.role).indexOf('PR') > -1);

        const params = {};

        if(req.query.history == 'Y' && req.query.periodDate) {
            resp.status(400).json({status:'error', message: 'wykluczające się parametry'});
            return;
        }

        // if(req.query.periodDate && isBoss) params.periodDate = req.query.periodDate;
        // else params.periodDate = moment().format('YYYY-MM-DD');
        if(req.query.periodDate) params.periodDate = req.query.periodDate;
        else params.periodDate = moment().format('YYYY-MM-DD');

        if(req.query.history && req.query.history == 'Y') {
            params.history = 'Y';
            // params.periodDate = moment().add(-1,'month').format('YYYY-MM-DD');
        } else params.history = "N";

        if(['Y','N'].indexOf(params.history) < 0) {
            resp.status(400).json({status:'error', message: 'zły parametr historii'});
            return;
        }

        if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(params.periodDate)) {
            console.log(params.periodDate);
            
            resp.status(400).json({status:'error', message: 'zła data okresu'});
            return;
        }

        if(req.query.personId && isBoss) params.personId = req.query.personId;
        else if(!req.query.personId && isBoss) params.personId = "0";
        else params.personId = req.context.id;

        payroll_db.read(params, addCtx(function(err, payrollRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const payroll = mapper.mapList(mapper.payroll.mapToJson,payrollRows);
            filterPayrollFields(req.context,payroll);
            resp.json(payroll); 
        }));
    },

    update: function(req, resp) {

        const isBoss = ([].concat(req.context.role).indexOf('PR') > -1);

        const params = {};

        if(req.body.approved && isBoss) params.approved = req.body.approved;
        else params.approved = "N";

        if(req.body.periodDate && isBoss) params.periodDate = req.body.periodDate;
        else params.periodDate = moment().format('YYYY-MM-DD');

        if(req.body.overTimeFactor && isBoss) params.overTimeFactor = req.body.overTimeFactor;
        else params.overTimeFactor = 1;

        try {
            params.overTimeFactor = parseFloat(params.overTimeFactor);
            if(params.overTimeFactor == null || isNaN(params.overTimeFactor) || params.overTimeFactor === 0 || params.overTimeFactor < 0) {
                throw 'invalid over time factor';
            } 
        } catch (error) {
            resp.status(400).json({status:'error', message: 'zły współczynnik nadgodzin'});
            return;
        }

        if(['Y','N'].indexOf(params.approved) < 0) {
            resp.status(400).json({status:'error', message: 'zły współczynnik akceptacji'});
            return;
        }

        if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(params.periodDate)) {
            resp.status(400).json({status:'error', message: 'zła data okresu'});
            return;
        }

        if(req.body.personId && isBoss) params.personId = req.body.personId;
        else if(!req.body.personId && isBoss) params.personId = "0";
        else params.personId = req.context.id;

        params.modifierId = req.context.id;

        payroll_db.update(params, addCtx(function(err, result){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            const rv = { updated: result };
            if(result > 0) resp.status(200);
            else resp.status(404);
            resp.json(rv); 
        }));
    }
};

function filterPayrollFields(context, payroll) {
    let currPayroll = null;
    payroll.list.filter((p)=>p.personId == context.id).forEach((p)=>currPayroll = p);
    payroll.list.forEach((p)=>{
        if(![].concat(context.role).some((p)=>['PR','OP'].indexOf(p)>=0) && (currPayroll == null || 
            (currPayroll.rankCode != 'SEN' && currPayroll.isFromPool != 'Y' )))  {
            delete p.budget;
            delete p.poolRate;
        }
    });
}

module.exports = payrolls;