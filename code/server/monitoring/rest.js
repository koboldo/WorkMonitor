/* jshint node: true, esversion: 6 */
'use strict';

const logger = require('../api/logger').logger;
const prometheus = require('./prometheus');
var interceptor = require('express-interceptor');


const promClient = prometheus.getPromClient();
const counter = new promClient.Counter({ name: 'botapp_rest_methods', help: 'botapp_rest_methods', labelNames: ['method', 'path', 'status'] });

module.exports = {
  registerRestInterceptor: function(app) {

    var restMetricsInterceptor = interceptor(function(req, res){
      return {
        // All responses will be intercepted
        isInterceptable: function(){
          return req.path != '/metrics';
        },
        // Appends a paragraph at the end of the response body
        intercept: function(body, send) {
          logger().debug(`intercepted req ${req.method} ${req.baseUrl}${req.path}, resp ${res.statusCode}`);
          counter.inc({ method: req.method, path: req.baseUrl+req.path, status: res.statusCode}, 1);
          send(body);
        }
      };
    })

    app.use(restMetricsInterceptor);
  }

};