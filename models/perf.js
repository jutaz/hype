var db = require('../lib/db').general;
var perf = {};

perf.get_request = function(id, callback) {
	if(!db.ObjectId.isValid(id)) {
		callback("Object Id is not valid", null);
		return;
	}
	db.collection("perf").find({_id: db.ObjectId(id)}).limit(0).toArray(function(err, results) {
		if(err) {
			error.mongo(err);
			callback(err, null);
			return;
		}
		if(results.length < 1) {
			callback(null, null);
			return;
		}
		callback(null, results[0]);
	});
}

module.exports = perf;