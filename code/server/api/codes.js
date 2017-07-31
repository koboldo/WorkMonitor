'use strict';

var util = require('util');
var mapper = require('./mapper.js');

var codes_db = require('./db/codes_db');

var codes = {
    
    readCodes: function(req, res) {
        
        codes_db.readCodes(req.params.codeTable,function(err, codeRows) {
			if(err) {
				res.status(500).send({status:'error', message: err});
				return;
			}
            
            // var codes = {list: []};
            // codeRows.forEach(function(codeRow) {
                // var code = mapper.code.mapToJson(codeRow);
                // codes.list.push(code);
            // });
            var codes = mapper.mapList(mapper.code.mapToJson,codeRows);
            res.send(codes);
        });
    },
    
    readTables: function(req, res) {
        
        codes_db.readTables(function(err, tableRows) {
            if(err) {
				res.status(500).send({status:'error', message: err});
				return;
			}
            
            // var tables = {list: []};
            // tableRows.forEach(function(tableRow) {
                // var table = mapper.codeTable.mapToJson(tableRow);
                // tables.list.push(table);
            // });
            
            var tables = mapper.mapList(mapper.codeTable.mapToJson,tableRows);
            res.send(tables);
        });
    }
};

module.exports = codes;