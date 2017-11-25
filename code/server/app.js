/* jshint node: true */
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var logger = require('./api/logger').getLogger('monitor'); 

var app = express();

app.use(express.static('public'));

app.use(morgan('dev')); //TODO: set relevant format & file for prod - combine with log4js
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var auth = require('./api/auth');
var validator = require('./api/validator');
app.post('/login', auth.authenticate);
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

var server = app.listen(process.env.PORT || '8080', function(){
	logger.info('NodeJs server started %s',server.address().port);
});