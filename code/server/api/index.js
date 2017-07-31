var express = require('express');
var router = express.Router();

var persons = require('./persons');
var orders = require('./orders');
var codes = require('./codes');
var workTypes = require('./workTypes');

//TODO: validations - for create and update
router.get('/v1/persons', persons.readAll);
router.post('/v1/persons', persons.create);
router.get('/v1/persons/:id', persons.read);
router.put('/v1/persons/:id', persons.update);

router.get('/v1/orders', orders.readAll);
router.post('/v1/orders', orders.create);
router.get('/v1/orders/:id', orders.read);
router.put('/v1/orders/:id', orders.update);

router.post('/v1/workTypes', workTypes.create);
router.get('/v1/workTypes/:id', workTypes.read);
router.put('/v1/workTypes/:id', workTypes.update);

router.get('/v1/codes', codes.readTables);
router.get('/v1/codes/:codeTable', codes.readCodes);

module.exports = router;


// /api/v1/persons/$ID/orders
// /api/v1/persons/$ID/orders
// /api/v1/persons/$ID/orders/$WOID
// /api/v1/orders
// /api/v1/orders/$WOID
// /api/v1/orders/$WOID
// /api/v1/orders
// /api/v1/codes/$CODETABLE
// /api/v1/analytics/$REPORT_ID
// /api/v1/accounts
// /api/v1/accounts/$LOGIN
// /api/v1/login
