/* jshint node: true, esversion: 6 */
'use strict';

var logger = require('./logger').getLogger('monitor'); 

var validator = {
    validateIncoming: function(req, res, next) {
        if(req.path == '/api/v1/persons' && ['POST','PUT'].indexOf(req.method) >= 0 ) {

            if(req.body && [].concat(req.body.roleCode).indexOf('PR') >= 0) {
                if(req.context && [].concat(req.context.role).indexOf('PR') < 0) {
                    return res.status(403).json({
                        success: false,
                        message: "utworzenie nowego użytkownika o takiej roli nie jest możliwe"
                    });
                }
            }
        }

        if(req.path == '/api/v1/persons' && req.method == 'POST') {
            if(req.body && req.body.personId != req.context.id && 
                [].concat(req.context.role).filter((r)=>['OP','PR'].indexOf(r) >= 0).length == 0) {
                    return res.status(403).json({status: 'error', message: 'niedozwolona zmiana'});
            }    
        }

        next();
    }
};

module.exports = validator;
