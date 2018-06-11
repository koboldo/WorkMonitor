var express = require('express');
var router = express.Router();

var persons = require('./persons');
var orders = require('./orders');
var codes = require('./codes');
var workTypes = require('./workTypes');
var timeSheets = require('./timeSheets');
var relatedItems = require('./relatedItems');
var payroll = require('./payroll');

//TODO: validations - for create and update
router.get('/v1/persons', persons.readAll);
router.post('/v1/persons', persons.create);
router.get('/v1/persons/:id', persons.read);
router.get('/v1/persons/history/:id', persons.readHistory);
router.put('/v1/persons/:id', persons.update);
router.post('/v1/persons/:pid/order/:oid', persons.addOrder);
router.delete('/v1/persons/:pid/order/:oid', persons.removeOrder);

router.get('/v1/report/personOrders', persons.readOrders);
// router.get('/v1/report/ordersTotalPrice', orders.calculateTotalPriceForCompleted);
router.get('/v1/report/protocol', orders.prepareProtocol);

router.get('/v1/orders', orders.readAll);
router.post('/v1/orders', orders.create);
router.get('/v1/orders/:id', orders.read);
router.get('/v1/orders/external/:extId', orders.read);
router.get('/v1/orders/history/:id', orders.readHistory);
router.put('/v1/orders/:id', orders.update);
router.put('/v1/orders/external/:extId', orders.update);

router.get('/v1/workTypes', workTypes.readAll);
router.post('/v1/workTypes', workTypes.create);
router.get('/v1/workTypes/:id', workTypes.read);
router.put('/v1/workTypes/:id', workTypes.update);

router.get('/v1/codes', codes.readTables);
router.get('/v1/codes/:codeTable', codes.readCodes);

router.post('/v1/timeSheets', timeSheets.create);
router.post('/v1/timeSheets/leave', timeSheets.createLeave);
router.get('/v1/timeSheets', timeSheets.readAll);

router.get('/v1/relatedItems/:id', relatedItems.read);
router.get('/v1/relatedItems', relatedItems.readAll);
router.post('/v1/relatedItems', relatedItems.create);
router.put('/v1/relatedItems/:id', relatedItems.update);

router.get('/v1/payroll',payroll.read);
router.get('/v1/payroll/:id',payroll.read);

module.exports = router;


// /api/v1/analytics/$REPORT_ID
// /api/v1/accounts
// /api/v1/accounts/$LOGIN
// /api/v1/login
