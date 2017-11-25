/* jshint node: true, esversion: 6 */
'use strict';

var logger = require('./logger').getLogger('monitor'); 

var validator = {
    validateIncoming: function(req, res, next) {

        if(req.path == '/api/v1/persons' && req.method == 'POST') {
            if(req.body && req.body.roleCode == 'PR') {
                if(req.context && req.context.role != 'PR') {
                    return res.status(403).json({
                        success: false,
                        message: "creating user in such role is not allowed"
                    });
                }
            }
        }

        next();
    }
};

module.exports = validator;
