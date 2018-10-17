/* jshint node: true, esversion: 6 */
'use strict';
const log4js = require('log4js');
const fs = require('fs');
const path  = require('path');
const cls = require('continuation-local-storage');

function prepareLoggerConfiguration() {
    try {
        let loggerConfPath = path.join(process.env.WM_CONF_DIR, 'logger.json');
        let data = fs.readFileSync(loggerConfPath, 'utf8');
        log4js.configure(JSON.parse(data));
    } catch(err) {
        console.log(err);
        console.log("Setting default configuration for logger");
        log4js.configure({
            appenders: { monitorFileLog: { type: 'file', filename: 'monitor.log' } },
        categories: { default: { appenders: ['monitorFileLog'], level: 'info' } }
        });
    }
}

prepareLoggerConfiguration();

const myLog4js = {
    getLogger: function(loggerName) {
        let ctx = cls.getNamespace('ctx');
        if(ctx == null || ctx.active == null) {
            let logger = log4js.getLogger(loggerName);
            logger.addContext('traceId','');
            return logger;
        }

        let logger = ctx.get('logger');
        if(logger) {
            return logger;
        } else {
            logger = log4js.getLogger(loggerName);
            logger.addContext('traceId',ctx.get('traceId'));
            ctx.set('logger',logger);
            return logger;
        }
    },
    logger: function(loggerName) {
        return myLog4js.getLogger('monitor');
    },
    addCtx:  function(func) {
        return cls.getNamespace('ctx').bind(func);
    }
};

module.exports = myLog4js;
