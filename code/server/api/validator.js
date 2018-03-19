/* jshint node: true, esversion: 6 */
'use strict';

var logger = require('./logger').getLogger('monitor'); 

var validator = {
    validateIncoming: function(req, res, next) {
        if(logger.isDebugEnabled()) logger.debug('incoming ' + req.method + ' ' + req.path);
        if(logger.isDebugEnabled()) logger.debug(JSON.stringify(req.body));
        
        try {
            checkIfTimesheetCanBeModified(req);
            checkIfPersonCanBeModified(req);
            checkIfPrezesCanBeAdded(req);
            checkIfPayrollCanBeViewed(req);
            checkIfPayrollCanBeViewed2(req);
            checkIfModificationCanBeDone(req);
        } catch (error) {
            logger.warn('validation error: ' + error.message);
            logger.warn(error.stack.split("\n")[1]);
            return res.status(403).json({status: 'error', message: error.message});
        }

        next();
    }
};

function checkIfPrezesCanBeAdded(req) {
    if(req.path == '/api/v1/persons' && ['POST','PUT'].indexOf(req.method) >= 0 ) {
        if(req.body && [].concat(req.body.roleCode).indexOf('PR') >= 0 
            && req.context && [].concat(req.context.role).indexOf('PR') < 0) {
                throw new Error('utworzenie nowego użytkownika o takiej roli nie jest możliwe');
        }
    }
}

function checkIfPersonCanBeModified(req) {
    if(req.path == '/api/v1/persons' && ['POST','PUT'].indexOf(req.method) >= 0) {
        if(req.body && req.body.personId != req.context.id 
            && [].concat(req.context.role).filter((r)=>['OP','PR'].indexOf(r) >= 0).length == 0) {
                throw new Error('niedozwolona zmiana');
        }    
    }
}

function checkIfTimesheetCanBeModified(req) {
    if(req.path.startsWith('/api/v1/timesheets') && req.method == 'POST'){
        if([].concat(req.context.role).indexOf('OP') < 0
            && req.body && ((req.body.from && req.body.from != 'now') || (req.body.to && req.body.to != 'now'))) {
                throw new Error('niedozwolona zmiana');
        }
    }
}

function checkIfPayrollCanBeViewed(req) {
    if('/api/v1/payroll' == req.path && req.method == 'GET') {
        if([].concat(req.context.role).indexOf('PR') < 0) {
            throw new Error('dostęp wzbroniony');
        }
    }
}

function checkIfPayrollCanBeViewed2(req) {
    if(req.path.startsWith('/api/v1/payroll/') && req.method == 'GET') {
        if(req.params.id && parseInt(req.params.id) != parseInt(req.context.id)) {
            throw new Error('dostęp wzbroniony');
        }
    }
}

function checkIfModificationCanBeDone(req) {
    if(['/api/v1/persons','/api/v1/timesheets'].indexOf(req.path) < 0 && ['POST','PUT'].indexOf(req.method) >= 0) {
        if([].concat(req.context.role).filter((r)=>['OP','PR','MG'].indexOf(r) >= 0).length == 0) {
            throw new Error('niedozwolona zmiana');
        }
    }
}

module.exports = validator;
