'use strict';

var db_utils = require('./db/db_util');
var dateformat = require('dateformat');

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
let now = new Date();
let endOfMonth = new Date(new Date().getFullYear(),new Date().getMonth()+1,0);
let beginningOfMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
console.log(beginningOfMonth.toLocaleDateString("pl-PL"));
console.log(endOfMonth.toLocaleDateString("pl-PL"));
console.log(endOfMonth.toDateString());

console.log(dateformat(Date.now(),'yyyy-mm-dd'));