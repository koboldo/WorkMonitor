var mapper = require('./mapper');
var timeSheets_db = require('./db/timeSheets_db');

var timeSheets = {
	
	read: function(req, res) {
        var personId = req.params.personId;
        var orderId = req.params.orderId;        
        timeSheets_db.readAggregatedTime(personId, orderId, function(err, timeSheetRow){
            if(err) {
                res.status(500).json({status:'error', message: 'request processing failed'});
                return;
            }
            
            if(timeSheetRow) {
                var timeSheet = mapper.timeSheet.mapToJson(timeSheetRow);
                res.json(timeSheet);
            } else {
                res.status(404).end();
            }
        });
    }, 
	
	create: function(req, res) {
		
		req.body['personId'] = req.params.personId
		req.body['orderId'] = req.params.orderId;
		
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