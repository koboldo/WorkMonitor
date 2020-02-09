/* jshint node: true */
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
// var morgan = require('morgan');
var helmet = require('helmet');
var fs = require('fs');
var http = require('http');
var cls = require('continuation-local-storage');
var nanoid = require('nanoid');

if(!process.env.WM_CONF_DIR) throw new Error('Env variable WM_CONF_DIR not set! Aborting...');
if(process.env.NODE_ENV != 'dev' && !process.env.WM_SOCKET) throw new Error('Env variable WM_SOCKET not set! Aborting...');

var logger = require('./api/logger').logger; 
var auth = require('./api/auth');
var validator = require('./api/validator');
var payrollScheduler = require('./schedulers/payroll');
var prometheusMetrics = require('./monitoring/prometheus');
var restMetricsInterceptor = require('./monitoring/rest');

var ctx = cls.createNamespace('ctx');
var app = express();

// app.use(express.static('public'));

// app.use(morgan('dev')); //TODO: set relevant format & file for prod - combine with log4js
restMetricsInterceptor.registerRestInterceptor(app);
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    // CLS needs this as context
    ctx.run(function() {
        var tid = req.headers['Session-Id'] || nanoid(16);
        ctx.set('traceId',tid);
        next();
    });
});

app.post('/login', auth.authenticate);
app.post('/pwdreset', auth.sendHash);
app.put('/pwdreset', auth.validateHash);

app.all('/api/v1/*', auth.validateToken);
app.all('/api/v1/*', validator.validateIncoming);

app.use('/api', require('./api'));

prometheusMetrics.startMetricsServer(app);

app.use(function(req, res){
    res.status(404).json({
        "success": false,
        "message": "resource not found"
    });
});

app.disable('etag'); // TODO: investigate why

payrollScheduler.schedulePayrollRecalculation();
payrollScheduler.schedulePayrollApproval();

if(process.env.NODE_ENV == 'dev') {
    var server = app.listen(process.env.WM_PORT || '8080', function(){
        logger().info('http server started at %s',server.address().port);
    });
} else {
    var mask = process.umask(0);
    var socket = process.env.WM_SOCKET;
    if (fs.existsSync(socket)) {
        fs.unlinkSync(socket);
    }

    var socketServer = http.createServer(app);
    socketServer.listen(socket, function() {
        if (mask) {
            process.umask(mask);
            mask = null;
        }
    });
    logger().info('socket server started at %s', socket);
}



