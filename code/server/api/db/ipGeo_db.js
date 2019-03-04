/* jshint node: true, esversion: 6 */
'use strict';

const logErrAndCall = require('../local_util').logErrAndCall;
const dbUtil = require('./db_util');
// const logger = require('../logger').getLogger('monitor'); 
const logger = require('../logger').logger; 
const addCtx = require('../logger').addCtx;

const queries = {
	getCount: 'SELECT COUNT(*) AS COUNT FROM IP_GEO WHERE IP = ?'
};


const ipGeo_db = {
        
	readCount: function(ip, cb) {
		
		const db = dbUtil.getDatabase();
		let getIpStat = db.prepare(queries.getCount);
    	getIpStat.bind(ip);
    	if(logger().isDebugEnabled()) logger().debug('about '+queries.getCount);
        
		getIpStat.get(addCtx(function(err, row) {
			getIpStat.finalize();
            db.close();
            
            if(err) return logErrAndCall(err,cb);
            cb(null, row);
        }));
	
    },
    
    create: function(ipGeo, cb) {
    	dbUtil.performInsert(ipGeo, 'IP_GEO', null, function(err, newId){
    		if(err) return logErrAndCall(err,cb);
            cb(null,newId);
        });
    }
};

module.exports = ipGeo_db;
