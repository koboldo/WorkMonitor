'use strict';

var db_utils = require('./db/db_util');


console.log(db_utils.prepareDelete({'PERSON_ID':1, 'WO_ID':1},'PERSON_WO'));