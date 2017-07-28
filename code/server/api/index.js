var express = require('express');
var router = express.Router();

var persons = require('./persons.js');
var codes = require('./codes.js');

//TODO: validations - for create and update
router.get('/v1/persons', persons.readAll);
router.post('/v1/persons', persons.create);
router.get('/v1/persons/:id', persons.read);
router.put('/v1/persons/:id', persons.update);

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
