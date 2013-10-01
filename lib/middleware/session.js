var objectId = require('objectid');
var session_model = require('../../models/session');

module.exports = function(express) {
	session_model.auto_clean(function() {});
	var Store = express.session.Store;
	function session(options, callback) {
		options = options || {};
		Store.call(this, options);
		callback && callback()
	}

	session.prototype.__proto__ = Store.prototype;

	session.prototype.get = function(sid, callback) {
		var self = this;
		session_model.get(sid, function(err, exists, sess) {
			if (err) {
				callback && callback(err, null);
			} else {
				if (sess) {
					if (!sess.expires || new Date < sess.expires) {
						callback(null, sess.session);
					} else {
						self.destroy(sid, callback);
					}
				} else {
					callback && callback();
				}
			}
		});
	};


	session.prototype.set = function(sid, sess, callback) {
		var s = {_id: sid, session: sess};
		if (sess && sess.cookie) {
			if (sess.cookie.expires) {
				s.expires = new Date(sess.cookie.expires);
			} else {
				s.expires = new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 14));
			}
		}
		session_model.set(s, function(err) {
			err && callback(err);
			!err && callback();
		});
	};

	session.prototype.destroy = function(sid, callback) {
		session_model.destroy(sid, function(err) {
			callback && callback();
		});
	};

	session.prototype.length = function(callback) {
		session_model.count_all(function(err, num) {
			if (err) {
				callback && callback(err);
			} else {
				callback && callback(null, num);
			}
		});
	};

	session.prototype.clear = function(callback) {
		session_model.clear(function(err) {
			if(err) {
				callback && callback(err);
			} else {
				callback && callback();
			}
		});
	};
	return session;
}