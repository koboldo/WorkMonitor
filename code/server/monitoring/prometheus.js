/* jshint node: true, esversion: 6 */
'use strict';

var logger = require('../api/logger').logger;
const prom = require('prom-client');
const collectDefaultMetrics = prom.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 10000, prefix: 'botapp_' });

function getMetricsBindIp() {
  return process.env.WM_METRICS_BIND_IP || '172.17.0.1';
}

function getMetricsPort() {
  return +(process.env.WM_METRICS_PORT || '8081');
}


var prometheus = {
  startMetricsServer: function(app) {
    app.get('/metrics', function(req, res, next) {
      if (req.socket.localPort === getMetricsPort()) {
        res.set('Content-Type', prom.register.contentType);
        res.end(prom.register.metrics());
      } else {
        res.status(421).json({
          "success": false,
          "message": "wrong port"
        });
      }
    });

    var metricsServer = app.listen(getMetricsPort(), getMetricsBindIp(), function(){
      logger().info('http metrics server started at %s', metricsServer.address().port);
    });
  },

  getPromClient: function() {
    return prom;
  }
};


module.exports = prometheus;