'use strict';
var util = require('util');
var fs = require('fs');
var path  = require('path');
var logger = require('./logger').getLogger('monitor'); 


var mappings;

try {
    mappings = JSON.parse(fs.readFileSync(path.join(__dirname,'../mappings.json'), 'utf8'));
} catch(err) {
    logger.error('Failed to load mappings. ',err.message);
    process.exit(1);
}

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