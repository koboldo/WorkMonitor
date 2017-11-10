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
                console.log('type ' + typeof timeSheetResultDb);
                if(params.personId) timeSheetResult = mapper.timeSheet.mapToJson(timeSheetResultDb[0]);
                else timeSheetResult = mapper.mapList(mapper.timeSheet.mapToJson, timeSheetResultDb);
                
                res.json(timeSheetResult);
            } else {
                res.status(404).end();
            }
        });
    }, 
	
	create: function(req, res) {
		
		req.body['personId'] = req.params.personId
		
        var timeSheetSql = mapper.timeSheet.mapToSql(req.body);
        timeSheets_db.create(timeSheetSql, function(err,result) {
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            var rv = { created: result }
            if(result) res.status(201).json(rv);
            else res.status(404).end();
        });
    }
};

module.exports = timeSheets;