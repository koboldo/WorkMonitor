/* jshint node: true, esversion: 6 */
'use strict';

const logger = require('../api/logger').logger;
const prometheus = require('./prometheus');
var responseTime = require('response-time');


const promClient = prometheus.getPromClient();
const reqCounter = new promClient.Counter({
  name: 'botapp_rest_methods',
  help: 'Count of incoming HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const reqDuration = new promClient.Histogram({
  name: 'botapp_rest_methods_duration_ms',
  help: 'Duration of incomint HTTP requests in ms',
  labelNames: ['method', 'path'],
  // buckets for response time from 1ms to 1s
  buckets: [1, 50, 100, 200, 300, 400, 500, 750, 1000]
});

module.exports = {
  registerRestInterceptor: function(app) {

    app.use(responseTime(function (req, res, time) {
      if (req.path != '/metrics') {
        logger().debug(`intercepted req [${req.method} ${req.baseUrl}${req.path}], resp [${res.statusCode}], time [${time}] ms`);
        reqCounter.inc({ method: req.method, path: req.baseUrl+req.path, status: res.statusCode}, 1);
        reqDuration.labels(req.method, req.baseUrl+req.path).observe(time);
      }
    }));

  }

};