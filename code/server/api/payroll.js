/* jshint node: true, esversion: 6 */
'use strict';

var dateformat = require('dateformat');
var mapper = require('./mapper');
var payroll_db = require('./db/payroll_db');

var payrolls = {

    read: function(req, resp){

        var isBoss = ([].concat(req.context.role).indexOf('PR') > -1);
        console.log(JSON.stringify(req.query));
        var params = {};

        if(isBoss) params.approved = "Y";
        else params.approved = "N";

        if(req.query.periodDate && isBoss) params.periodDate = req.query.periodDate;
        else params.periodDate = dateformat(new Date(),'yyyy-mm-dd');

        if(req.query.overTimeFactor && isBoss) params.overTimeFactor = req.query.overTimeFactor;
        else params.overTimeFactor = 1;

        try {
            params.overTimeFactor = parseFloat(params.overTimeFactor);
        } catch (error) {
            resp.status(500).json({status:'error', message: 'zły współczynnik nadgodzin'});
            return;
        }

        if(!isBoss && req.params.id != req.context.id) {
            resp.status(403).json({status:'error', message: 'dostęp wzbroniony'});
            return;
        }

        if(req.query.personId && isBoss) params.personId = req.query.personId;
        else if(!req.query.personId && isBoss) params.personId = "0";
        else params.personId = req.context.id;

        params.modifierId = req.context.id;

        console.log(JSON.stringify(params));

        payroll_db.read(params, function(err, payrollRows){
            if(err) {
                resp.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var payroll = mapper.mapList(mapper.payroll.mapToJson,payrollRows);
            resp.json(payroll); 
        });
    }
};

module.exports = payrolls;