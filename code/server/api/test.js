'use strict';

var db_utils = require('./db/db_util');


console.log(db_utils.prepareDelete({'PERSON_ID':1, 'WO_ID':1},'PERSON_WO'));

var query = 'to %(fila)s jest %(filb)s ryba %(filc)s';

var queryFilters = {
    fila: "xxx %(fila)s xxx",
    filb: "yyy %(filb)s yyy",
    filc: "zzz %(filc)s zzz"
};

var params = {
    fila: "A",

    filc: "C"
};

console.log(db_utils.prepareFiltersByInsertion(
    query, params, queryFilters
));