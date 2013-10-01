var connect = require('connect');
var crc32 = require('buffer-crc32');
var Cookie = connect.session.Cookie;
var objectId = require('objectid');
var session_model = require('../../models/session');


var auth = {};
auth.web = function(req, res, next) {
	if(req.session.loggedIn && objectId.isValid(req.session.userID)) {
		next();
	} else {
		res.redirect('/login?redirectTo='+req.url);
	}
}

auth.staff = function(req, res, next) {
	if(req.session.loggedIn && objectId.isValid(req.session.userID) && req.user.staff) {
		next();
	} else {
		if(!res.locals.pjax) {
			res.status(404);
		} else {
			res.locals.statusCode = 404;
		}
		res.render('404');
	}
}

auth.socket = function(req, accept) {
	if (!req.headers.cookie) {
		return accept('No cookie.', false);
	}
	parser = connect.cookieParser(conf.cookie);
	res = {};
	req.originalUrl = "/";
	parser(req, res, function() {
		cookieSession(req, res, conf.cookie, function() {
			session_model.get(req.session.id, function(err, exists, sess) {
				if(err) {
					return accept(err, false);
				}
				if(!exists) {
					return accept("Session does not exist.", false);
				}
				if(sess.session.loggedIn) {
					req.session = sess.session;
					return accept(null, true);
				} else {
					return accept("Not logged In.", false);
				}
			})
		});
	});
}



function cookieSession(req, res, options, next) {
	options = options || {};
	var key = options.key || 'connect.sess';
	var trustProxy = options.proxy;
		// req.secret is for backwards compatibility
		var secret = options.secret || req.secret;
		if (!secret) throw new Error('`secret` option required for cookie sessions');

		// default session
		req.session = {};
		var cookie = req.session.cookie = new Cookie(options.cookie);

		// pathname mismatch
		if (0 != req.originalUrl.indexOf(cookie.path)) return next();

		// cookieParser secret
		if (!options.secret && req.secret) {
			req.session = req.signedCookies[key] || {};
			req.session.cookie = cookie;
			next();
			return;
		} else {
			// TODO: refactor
			var rawCookie = req.cookies[key];
			if (rawCookie) {
				var unsigned = connect.utils.parseSignedCookie(rawCookie, secret);
				if (unsigned) {
					var originalHash = crc32.signed(unsigned);
					req.session = {};
					req.session.id = unsigned;
					req.session.cookie = cookie;
				}
			}
			next();
			return;
		}
		next();
	}

	module.exports = auth;