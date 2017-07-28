var sqlite3 = require('sqlite3');
var async = require('async');
var util = require('util');

var db = new sqlite3.Database('./work-monitor.db');

var queries = {
	getAllPersons: 'SELECT ID, LAST_NAME, FIRST_NAME, OFFICE_CODE, GRADE_CODE FROM PERSON',
	getPerson: 'SELECT ID, LAST_NAME, FIRST_NAME, OFFICE_CODE, GRADE_CODE FROM PERSON WHERE ID = ?',
	getMaxPersonId: 'SELECT MAX(ID) AS MAX_ID FROM PERSON',
	getPersonOrderIds: 'SELECT WO.ID FROM WORK_ORDER WO, PERSON_WO PW WHERE PW.PERSON_ID = ? AND PW.WO_ID = WO.ID'
};

var tools = {
	getRowsIds: function(statement, rowId, cb) {
		statement.bind(rowId).all(function(err,rows){
			var ids = [];
			rows.forEach(function(row){
				ids.push(row.ID);
			});
			cb(ids);
		});
	},
    
    prepareInsert: function(personId, person) {
        var sqlCols = 'ID';
        var sqlVals = '' + personId;
        for(var col in person) {
            sqlCols += ', ' + col;
            sqlVals += ', "' + person[col] + '"';
        }

        return 'INSERT INTO PERSON (' + sqlCols + ') VALUES (' + sqlVals + ')';
    }
};

var persons_db = {
	
	read: function(personId, cb) {
		console.log('person read db with id : ' + personId);
				
		// TODO: validation in middleware
        var getPersonStat = db.prepare(queries.getPerson);
		getPersonStat.bind(personId).get(function(err, row) {
			// TODO: logging to file for prod
			if(err) return logErrAndCall(err,cb);
			
			if(row == null) {
				cb(null,null);
				return;
			}
            
			var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			tools.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
				row.WORK_ORDERS = ids;
				cb(null,row);
			});
		});
	},
	
	readAll: function(cb) {
		console.log('person readAll db');
		
		var getAllPersonsStat = db.prepare(queries.getAllPersons);
		getAllPersonsStat.all(function(err, rows) {
			
			if(err) return logErrAndCall(err,cb);
			
			// we need to group async funcs in order to deal in the same thread
			var calls = [];
			var persons = {list: []};
			
            var getPersonOrderIdsStat = db.prepare(queries.getPersonOrderIds)
			rows.forEach(function(row){
				calls.push(function(async_cb) {

                    tools.getRowsIds(getPersonOrderIdsStat, row.ID, function(ids){
						row.WORK_ORDERS = ids;
						async_cb();
					});
				});
			});
			
			async.parallel(calls, function(err, result) {
					if (err) {
						console.log(err);
						cb(err);
					} else {
						cb(null,rows);
					}
				});
		});
	},
	
	update: function(personId, person, cb) {

		var selectStr = 'SELECT COUNT(1) AS COUNT FROM PERSON WHERE ID=' + personId;
		
		var updateStr = '';
		for(var col in person) {
			if(col == 'ID') continue;
			
			if(updateStr.length > 0) {
				updateStr += ', ';
			}
			updateStr += col + '="' + person[col] + '"';
		}
		updateStr = 'UPDATE PERSON SET ' + updateStr + ' WHERE ID=' + personId; 
	
		db.run('BEGIN', function(err,result){
            if(err) return logErrAndCall(err,cb);
			
			var updateStat = db.prepare(queries.getPerson);
			updateStat.bind(personId).get(function(err, row) {
				if(err) {
					db.run('ROLLBACK')
					return logErrAndCall(err,cb);
				}
				
				if(row) {
					db.run(updateStr,function(err,result) {
						if(err) {
							db.run('ROLLBACK');
							return logErrAndCall(err,cb);
						}

						db.run('COMMIT',function(err,result) {
							if(err) {
								console.log(err);
								cb(err,0);
							} else {
								cb(null,1);
							}
						});
					});
				} else {
					db.run('END')
					cb(null,0);
				}
			});
			updateStat.finalize();
		});
	},
	
	create: function(person, cb) {

		db.run('BEGIN', function(err,result){
			if(err) return logErrAndCall(err,cb);
			
			var stat = db.prepare(queries.getMaxPersonId);
			stat.get(function(err,row){
				// console.log(util.inspect(err));	
				// console.log(util.inspect(row));	
				if(err) return logErrAndCall(err,cb);
				
				var newId = row.MAX_ID + 1;
				
				var statementStr = tools.prepareInsert(newId, person);			
				db.run(statementStr,function(err, result){
					if(err){
						db.run('ROLLBACK');
						return logErrAndCall(err,cb);
					}
					db.run('COMMIT',function(err,result) {
						if(err) {
							console.log(err);
							cb(err,0);
						} else {
							cb(null, newId);
						}
					});
				});
			});
			stat.finalize();
		});
	} 
};

function logErrAndCall(err,cb) {
	console.log(err.message);
	cb(err.message);
}

module.exports = persons_db;