'use strict';

var util = require('util');
var logger = require('./logger').getLogger('monitor'); 

var local_util = {
    logErrAndCall: function(err,cb) {
        logger.error(util.inspect(err));
        logger.error(err.message);
        logger.error(err.stack)
        cb(err, null);
    }
};

module.exports = local_util;