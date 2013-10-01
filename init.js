var express = require('express');
var expressValidator = require('express-validator');
var routes = require('./routes/main');
var middleware = require("./lib/middleware");
var path = require('path');

module.exports = function(options) {
	app = express();
	if(options.length < 1) {
		return app;
	}
	if (options.sessions) {
		session = middleware.session(express);
		conf.cookie.store = new session();
		app.use(express.cookieParser());
		app.use(express.session(conf.cookie));
	}
	if(options.logger) {
		app.use(middleware.logger);
	} else {
		console.warn("If you want to collect perfomance data and send it to hype-dashboard, you must enable logger middleware.");
	}
	if(options.public_dir) {
		app.use(express.static(path.normalize(options.public_dir)));
	}
	if(options.pjax) {
		app.use(middleware.pjax);
	}
	if(options.native_middleware) {
		app.use(express.favicon());
		app.use(express.bodyParser());
		app.use(express.methodOverride());
	}
	if(options.validator) {
		app.use(expressValidator());
	}
	if(options.user) {
		app.use(middleware.user);
	}
	if(options.nav) {
		app.use(middleware.nav);
	}

	app.locals.pretty = conf.development;

	if(options.template_dir) {
		app.set('views', path.normalize(options.template_dir));
		app.set('view engine', options.view_engine);
		if(options.view_engine == "jade") {
			app.engine('jade', require('jade').__express);
		} else {
			console.warn("You must specify app.engine by yourself.");
		}
	}

	if(options.default_routes) {
		app.get('/login', routes.login);
		app.post('/login', routes.login_step2);
		app.get('/logout', routes.logout);
		app.get('/register', routes.register);
		app.post('/register', routes.register_step2);
	}

	if(options.staff_mode) {
		app = require('./staff.js')(app);
	}
	
	return app;
}