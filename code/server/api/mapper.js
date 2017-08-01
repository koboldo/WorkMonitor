'use strict';
var util = require('util');
var fs = require('fs');
var path  = require('path');
var logger = require('./logger').getLogger('monitor'); 


var mappings

try {
    console.log(__dirname);
    mappings = JSON.parse(fs.readFileSync(path.join(__dirname,'../mappings.json'), 'utf8'));
} catch(err) {
    logger.error('Failed to load mappings. ',err.message);
    process.exit(1);
}


// var mappings = {
	// person: {
		// sqlToJson: {
			// ID: 'id',
			// FIRST_NAME: 'firstName',
			// LAST_NAME: 'lastName',
			// OFFICE_CODE: 'officeCode',
			// GRADE_CODE: 'gradeCode',
            // VERSION: 'version',
            // LAST_MOD: 'lastMod',
			// WORK_ORDERS: 'workOrders'
		// }
	// },
    // order: {
        // sqlToJson: {
            // ID: 'id',
            // WORK_NO: 'workNo',
            // STATUS_CODE: 'statusCode',
            // TYPE_CODE: 'typeCode',
            // COMPLEXITY_CODE: 'complexityCode',
            // COMPLEXITY: 'complexity',
            // DESCRIPTION:  'description',
            // COMMENT: 'comment',
            // PRICE: 'price',
            // VERSION: 'version',
            // LAST_MOD: 'lastModDate'
        // }
    // },
    // code: {
        // sqlToJson: {
            // CODE: 'code',
            // PARAM_INTVAL: 'paramInt',
            // PARAM_CHARVAL: 'paramChar'
        // }
    // },
    // codeTable: {
        // sqlToJson: {
            // CODE_TABLE: 'codeTable'
        // }
    // },
    // workType: {
        // sqlToJson: {
            // ID: 'id',
            // TYPE_CODE: 'typeCode',
            // OFFICE_CODE: 'officeCode',
            // COMPLEXITY_CODE: 'complexityCode',
            // COMPLEXITY: 'complexity',
            // PRICE: 'price'
        // }
    // }
// };

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
			if(inObj.hasOwnProperty(key) && inObj[key] != null) {
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
    },
    
    mapListToJson: function(mapperFunc, rows) {
        var items = {list: []};
        rows.forEach(function(row){
            var item = mapperFunc(row);
            items.list.push(item);
        });
        return items;
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
    
    order: {
        mapToJson: toolbox.produceMapper(mappings.order.sqlToJson),
        mapToSql: toolbox.produceMapper(toolbox.swap(mappings.order.sqlToJson)),
    },
    
    code: {
        mapToJson: toolbox.produceMapper(mappings.code.sqlToJson),
    },
    
    codeTable: {
        mapToJson: toolbox.produceMapper(mappings.codeTable.sqlToJson),
    },
    
    workType: {
        mapToJson: toolbox.produceMapper(mappings.workType.sqlToJson),
        mapToSql: toolbox.produceMapper(toolbox.swap(mappings.workType.sqlToJson)),
    },
    
    mapList: toolbox.mapListToJson
};

module.exports = mapper;