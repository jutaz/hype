var mongo = require('mongoskin');
var objectId = require('objectid');
var db = {};

if(!conf.db.database.general) {
	throw new Error("No general DB defined. Exitting....");
	process.exit();
}

for (var i in conf.db.database) {
	db[i] = mongo.db('mongo://'+conf.db.username+':'+conf.db.password+'@'+conf.db.host+':'+conf.db.port+'/'+conf.db.database[i], {'auto_reconnect': true , 'poolSize': 1 , w:1 , safe: true});
	db[i].ObjectId = objectId;
	db[i].open(function(err, data) {
		if(err) {
			error.mongo(err, function() {
				throw new Error(err);
			});
		}
	});
	db[i].on('error', function(err) {
		error.mongo(err, function() {

		});
	});
}

module.exports = db;