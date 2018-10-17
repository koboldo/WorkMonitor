/* jshint node: true, esversion: 6 */
'use strict';

const mapper = require('./mapper.js');
const codes_db = require('./db/codes_db');
const addCtx = require('./logger').addCtx;

const codes = {
    
    readCodes: function(req, res) {
        
        codes_db.readCodes(req.params.codeTable,addCtx(function(err, codeRows) {
			if(err) {
				res.status(500).json({status:'error', message: 'request processing failed'});
				return;
			}
            
            const codes = mapper.mapList(mapper.code.mapToJson,codeRows);
            res.json(codes);
        }));
    },
    
    readTables: function(req, res) {
        
        codes_db.readTables(addCtx(function(err, tableRows) {
            if(err) {
				res.status(500).json({status:'error', message: 'request processing failed'});
				return;
			}

            const tables = mapper.mapList(mapper.codeTable.mapToJson,tableRows);
            res.json(tables);
        }));
    }
};

module.exports = codes;