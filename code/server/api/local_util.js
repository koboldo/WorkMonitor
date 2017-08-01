'use strict';

var util = require('util');
var logger = require('./logger').getLogger('monitor'); 

var local_util = {
    logErrAndCall: function(err,cb) {
        logger.error(err.message);
        cb(err.message);
    }
};

module.exports = local_util;