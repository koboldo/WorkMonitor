'use strict';
var log4js = require('log4js');
var fs = require('fs');
var path  = require('path');

try {
    var data = fs.readFileSync(path.join(__dirname,'../logger.json'), 'utf8');
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
