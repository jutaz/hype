var crypto = require('crypto');
var util = require('util');
var os = require("os");
var users = require('../models/users');
var states = require("../lib/states.json");
var helper = require("../lib/helper");

var routes = {};
routes.staff = require('./staff');

routes.register = function(req, res) {
	res.render('register');
}

routes.register_step2 = function(req, res) {
	data = req.body;

	req.sanitize('email').xss();
	req.sanitize('username').xss();
	req.sanitize('name').xss();
	req.sanitize('last_name').xss();

	req.checkBody('email', states.invalid_email).notEmpty().isEmail();
	req.checkBody('username', states.invalid_username).notEmpty().len(3);
	req.checkBody('password', states.passwords_do_not_match).equals(req.body.password_repeat);
	req.checkBody('password', states.password_too_short).len(8);
	req.checkBody('password', states.password_must_be_alphanumeric).isAlphanumeric();
	req.checkBody('name', states.invalid_name).notEmpty().isAlpha();
	req.checkBody('last_name', states.invalid_last_name).notEmpty().isAlpha();

	helper.generateStatusStringFromErrors(req.validationErrors(), function(foundErrors, status) {
		if (foundErrors) {
			res.redirect('/register?state='+status);
			return;
		}

		users.exists({username: data.username, email: data.email}, function(err, exists) {
			if (err) {
				return;
			}
			if (exists) {
				res.redirect('/register?state='+states.user_exists);
			} else {
				users.register(data, function(err, success, userId) {
					req.session.loggedIn = true;
					req.session.userID = userId;
					if(req.query.redirectTo) {
						res.redirect(req.query.redirectTo);
					} else {
						res.redirect("/");
					}
				});
			}
		});
	});
}

routes.login = function(req, res) {
	res.render('login');
}

routes.login_step2 = function(req, res) {
	req.sanitize('username').xss();
	req.sanitize('password').xss();
	users.login(req.body.username, req.body.password, function(err, success, userId) {
		if(!success) {
			res.redirect("/login?state="+err);
		} else {
			req.session.loggedIn = true;
			req.session.userID = userId;
			if(req.query.redirectTo) {
				res.redirect(req.query.redirectTo);
			} else {
				res.redirect("/");
			}
		}
	});
}

routes.logout = function(req, res) {
	req.session.loggedIn = false;
	delete req.session.userID;
	delete req.user;
	res.redirect("/");
}

routes.error_404 = function(req, res) {
	if(!res.locals.pjax) {
		res.status(404);
	} else {
		res.locals.statusCode = 404;
	}
	res.render('404');
}

routes.log_error = function(req, res) {
	error.clientJS(req.body, function() {
		res.send("ok");
	});
}

module.exports = routes;