'use strict';
var util = require('util');

var mappings = {
	person: {
		sqlToJson: {
			ID: 'id',
			FIRST_NAME: 'firstName',
			LAST_NAME: 'lastName',
			OFFICE_CODE: 'officeCode',
			GRADE_CODE: 'gradeCode',
            VERSION: 'version',
            LAST_MOD: 'lastMod',
			WORK_ORDERS: 'workOrders'
		}
	},
    order: {
        sqlToJson: {
            ID: 'id',
            WORK_NO: 'workNo',
            STATUS_CODE: 'statusCode',
            DESCRIPTION:  'description',
            COMMENT: 'commnet',
            COMPLEXITY: 'complexity',
            VERSION: 'version',
            LAST_MOD_DATE: 'lastModDate'
        }
    },
    code: {
        sqlToJson: {
            CODE: 'code',
            PARAM_INTVAL: 'paramInt',
            PARAM_CHARVAL: 'paramChar'
        }
    },
    codeTable: {
        sqlToJson: {
            CODE_TABLE: 'codeTable'
        }
    }
};

var toolbox = {
	
	swap: function(map){
		var newmap = {};
		for(var key in map){
			newmap[map[key]] = key;
		}
		return newmap;
	},	

	map: function(inObj, outObj, map) {
		for(var key in map) {
			if(inObj.hasOwnProperty(key)) {
				outObj[map[key]] = inObj[key];
			}
		}
	},	
    
    produceMapper: function(map) {
        return function(inSql) {
            var outJson = {};
            toolbox.map(inSql,outJson,map);
			return outJson;
        }
    }
};

//TODO: add HATEOS ???
// var attributes = {
	// person: {
		// type: "person"
	// }
// };

var mapper = {
	
	person: {		
        mapToJson: toolbox.produceMapper(mappings.person.sqlToJson),
        mapToSql: toolbox.produceMapper(toolbox.swap(mappings.person.sqlToJson)),
	},
    code: {
        mapToJson: toolbox.produceMapper(mappings.code.sqlToJson),
    },
    codeTable: {
        mapToJson: toolbox.produceMapper(mappings.codeTable.sqlToJson),
    }
};

module.exports = mapper;