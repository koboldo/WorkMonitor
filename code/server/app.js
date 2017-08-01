'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var logger = require('./api/logger').getLogger('monitor'); 

var app = express();

app.use(express.static('public'));

app.use(morgan('dev')); //TODO: set relevant format & file for prod
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var api = require('./api');
app.use('/api',api);

app.use(function(req, res){
    res.status(404).end();
});

app.disable('etag'); // TODO: investigate why

app.use(function(req, res, next) {	
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var server = app.listen(process.env.PORT || '8080', function(){
	logger.info('NodeJs server started %s',server.address().port);
});