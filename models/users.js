var crypto = require('crypto');
var states = require("../lib/states.json");
var db = require('../lib/db');
var users = {};

users.exists = function(fields, callback) { //callback params: error, exists.
	var arr = [];
	for (var i in fields) {
		tmp = {};
		tmp[i] = fields[i]
		arr.push(tmp);
	}
	db.general.collection('users').find({ $or: arr }).count(function(err, count) {
		if(err) {
			error.mongo(err);
			callback(err);
			return;
		} else {
			callback(false, Boolean(count));
		}
	});
}

users.get = function(id, callback) { //callback params: error, user(s) object.
	var what = {};
	if(id) {
		what._id = db.general.ObjectId(id);
	}
	db.general.collection('users').find(what, {'password': 0}).toArray(function(err, data) {
		if(err) {
			error.mongo(err);
			callback(err);
			return;
		}
		callback(false, data);
	});
}

users.login = function(username, password, callback) { //callback params: error, login success.
	db.general.collection('users').find({ $or: [{email: username}, {username: username}] }).toArray(function(err, results) {
		if(err) {
			error.mongo(err);
			callback(err, false, null);
			return;
		} else {
			if(results.length < 1) {
				callback(states.failure, false);
				return;
			}
			if(results[0].password === crypto.createHash("sha256").update(password, "utf8").digest("base64")) {
				callback(false, true, results[0]._id);
			} else {
				callback(states.failure, false);
			}
		}
	});
}

users.register = function(data, callback) { //callback params: error, register success, userId
	data.password = crypto.createHash("sha256").update(data.password, "utf8").digest("base64");
	delete data.password_repeat;
	db.general.collection('users').insert(data, {w:0}, function(err, data) {
		if(err) {
			callback(err, false, null);
			return;
		} else {
			callback(false, true, data[0]._id);
		}
	});
}

users.get_by_username = function(username, callback) {
	db.general.collection('users').find({"username": username}).limit(1).toArray(function(err, results) {
		if(err) {
			error.mongo(err);
			callback(true, null);
			return;
		} else {
			if(results.length < 1) {
				callback(false, false);
				return;
			}
			callback(false, results[0]);
		}
	});
}

users.is_online = function(user, callback) {
	if(!db.general.ObjectId.isValid(user)) {
		users.get_by_username(user, function(err, user) {
			id = user._id
			db.general.collection('users').find({ $and: [{_id: db.general.ObjectId(id)}, {online: true} ]}).count(function(err, count) {
				if(err) {
					error.mongo(err);
					callback(true, null);
					return;
				} else {
					if(count < 1) {
						callback(false, false);
						return;
					}
					callback(false, true);
				}
			});
		});
	} else {
		db.general.collection('users').find({ $and: [{_id: db.general.ObjectId(user)}, {online: true} ]}).count(function(err, count) {
			if(err) {
				error.mongo(err);
				callback(true, null);
				return;
			} else {
				if(count < 1) {
					callback(false, false);
					return;
				}
				callback(false, true);
			}
		});
	}
}

users.set_online = function(user, callback) {
	if(!db.general.ObjectId.isValid(user)) {
		callback(new Error(user+' objectId is not valid'), false);
		return;
	}
	db.general.collection('users').update({ _id: db.general.ObjectId(user) }, { $set: { online: true, online_since: Math.round((new Date()).getTime() / 1000)} }, function(err, data) {
		if(err) {
			error.mongo(err);
			callback(err, false);
			return;
		} else {
			callback(false, true);
		}
	});
}

users.set_offline = function(user, callback) {
	db.general.collection('users').update({ _id: db.general.ObjectId(user) }, { $set: { online: false} }, function(err, data) {
		if(err) {
			error.mongo(err);
			callback(err, false);
			return;
		} else {
			callback(false, true);
		}
	});
}

users.get_online = function(callback) {
	db.general.collection('users').find({online: true}).toArray(function(err, results) {            
		if(err) {
			error.mongo(err);
			callback(err, false);
			return;
		} else {
			callback(false, results);
		}
	});
}

module.exports = users;