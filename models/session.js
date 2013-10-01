var db = require('../lib/db').general;
var session = {};

session.get = function(id, callback) {
	db.collection('session').find({ _id: id}).limit(1).toArray(function(err, results) {
		if(err) {
			error.mongo(err);
			callback(err, null);
			return;
		}
		if(results.length < 1) {
			callback(null, false, null);
			return;
		}
		callback(null, true, results[0]);
	});
}

session.create = function(id, callback) {
	db.collection('session').insert({_id: id}, function(err, data) {
		if(err) {
			error.mongo(err);
			callback(err, null);
			return;
		}
		callback(null, data[0]._id);
	});
}

session.set = function(session, callback) {
	db.collection('session').save(session, function(err, data) {
		if (err) {
			callback && callback(err);
		} else {
			callback && callback(null);
		}
	});
}

session.destroy = function(sid, callback) {
	db.collection('session').removeById(sid, function(err) {
		err && callback && callback(err);
		callback && callback();
	});
}

session.clear = function(callback) {
	db.collection('session').drop(function(err) {
		if(err) {
			callback && callback(err);
		} else {
			callback && callback();
		}
	});
}

session.count_all = function(callback) {
	db.connection('session').find().count(function(err, num) {
		if(err) {
			callback && callback(err);
		} else {
			callback && callback(null, num);
		}
	});
}

session.auto_clean = function(callback) {
	db.collection('session').ensureIndex({expires: 1}, {expireAfterSeconds: 0}, function(err, result) {
		if (err) {
			throw new Error('Error setting TTL index :  ' + err);
		}
		callback && callback();
	});
}



module.exports = session;