/* jshint node: true */
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var fs = require('fs');
var http = require('http');

if(!process.env.WM_CONF_DIR) throw new Error('Env variable WM_CONF_DIR not set! Aborting...');

var logger = require('./api/logger').getLogger('monitor'); 


var app = express();

app.use(express.static('public'));

app.use(morgan('dev')); //TODO: set relevant format & file for prod - combine with log4js
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var auth = require('./api/auth');
var validator = require('./api/validator');
app.post('/login', auth.authenticate);
app.post('/pwdreset', auth.sendHash);
app.put('/pwdreset', auth.validateHash);

app.all('/api/v1/*', auth.validateToken);
app.all('/api/v1/*', validator.validateIncoming);

app.use('/api', require('./api'));

app.use(function(req, res){
    res.status(404).json({
        "success": false,
        "message": "resource not found"
    });
});

app.disable('etag'); // TODO: investigate why


if(process.env.NODE_ENV == 'dev') {
    var server = app.listen(process.env.PORT || '8080', function(){
        logger.info('http server started at %s',server.address().port);
    });
} else {
    var mask = process.umask(0);
    var socket = '/tmp/nginx2node';
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
    logger.info('socket server started at %s', socket);
}
