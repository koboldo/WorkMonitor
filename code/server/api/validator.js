/* jshint node: true, esversion: 6 */
'use strict';

var logger = require('./logger').getLogger('monitor'); 

var validator = {
    validateIncoming: function(req, res, next) {
        if((req.path == '/api/v1/persons' && req.method == 'POST')
            || (req.path.startsWith('/api/v1/persons/') && req.method == 'PUT')) {
            if(req.body && req.body.roleCode == 'PR') {
                if(req.context && req.context.role != 'PR') {
                    return res.status(403).json({
                        success: false,
                        message: "utworzenie nowego użytkownika o takiej roli nie jest możliwe"
                    });
                }
            }
        }

        next();
    }
};

module.exports = validator;
