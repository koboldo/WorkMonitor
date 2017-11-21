var mapper = require('./mapper');
var timeSheets_db = require('./db/timeSheets_db');

var timeSheets = {
	
	read: function(req, res) {
        
        var params = req.query;
        if(req.params.personId) params.personId = req.params.personId;

        timeSheets_db.readAggregatedTime(params, function(err, timeSheetResultDb){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(timeSheetResultDb) {
                var timeSheetResult;
                if(params.personId) timeSheetResult = mapper.timeSheet.mapToJson(timeSheetResultDb[0]);
                else timeSheetResult = mapper.mapList(mapper.timeSheet.mapToJson, timeSheetResultDb);
                
                res.json(timeSheetResult);
            } else {
                res.status(404).end();
            }
        });
    }, 

    readAll: function(req, res) {
        timeSheets_db.readAll(req.query, function(err, timeSheetRows){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var timeSheets = mapper.mapList(mapper.timeSheet.mapToJson,timeSheetRows);
            res.json(timeSheets);
        });
    },
	
	create: function(req, res) {
		
		req.body.personId = req.params.personId;
		
        var timeSheetSql = mapper.timeSheet.mapToSql(req.body);
        timeSheets_db.create(timeSheetSql, function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { created: result };
            res.status(201).json(rv);
        });
    },

    bulkCreate: function(req, res) {
        var timeSheets = mapper.mapList(mapper.timeSheet.mapToSql, req.body).list;
        timeSheets_db.bulkCreate(timeSheets, function(err, result){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { created: result };
            res.status(201).json(rv);
        });
    }
};

module.exports = timeSheets;