/* jshint node: true, esversion: 6 */
'use strict';
var log4js = require('log4js');
var fs = require('fs');
var path  = require('path');

try {
    var loggerConfPath = path.join(process.env.WM_CONF_DIR, 'logger.json');
    var data = fs.readFileSync(loggerConfPath, 'utf8');
    log4js.configure(JSON.parse(data));
} catch(err) {
    console.log(err);
    console.log("Setting default configuration for logger");
    log4js.configure({
      appenders: { monitorFileLog: { type: 'file', filename: 'monitor.log' } },
      categories: { default: { appenders: ['monitorFileLog'], level: 'info' } }
    });
}

module.exports = log4js;
