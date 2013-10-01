var settings = require('settings');
var https = require('https');
var fs = require('fs');
var path = require('path');
var options = {};

var main = {};

main.init = function(opts) {
	if(!opts) {
		throw new Error("Options must be specified!");
	}
	if(!opts.conf) {
		throw new Error("Options.conf must be specified!");
	}
	options = opts;
	global.conf = new settings(require(path.normalize(opts.conf)));
	global.conf.development = (conf.environment == "development");
	global.db = require("./lib/db");
	global.error = require("./lib/errorHandler");
	var logHooker = require('./lib/logHooker');
	var system = require('./init.js');
	if(opts.length == 1 && opts.conf) {
		return system({});
	}
	return system(opts);
}

main.listen = function(app, opts) {
	if(!opts) opts = {
		https: true,
		http: true,
		io: true
	};
	if(options.error_pages) {
		app = require('./error_pages')(app);
	}
	if (process.env['ssl'] == "true" && opts.https && opts.ssl) {
		var httpsServer = https.createServer({
			key: fs.readFileSync(path.normalize(opts.ssl.key), 'utf8'),
			cert: fs.readFileSync(path.normalize(opts.ssl.cert), 'utf8')
		}, app);
		httpsServer.listen(conf.ports.ssl);
		srv = httpsServer.listen(conf.ports.ssl);
		if(opts.io) {
			var io = require('socket.io').listen(srv, { log: conf.development });
		}
	} else {
		if(opts.http) {
			srv = app.listen(conf.ports.web);
		}
		if(opts.io) {
			if(srv) {
				var io = require('socket.io').listen(srv, { log: conf.development });
			} else {
				var io = require('socket.io').listen(conf.ports.web, { log: conf.development });
			}
		}
	}
	if(opts.io) {
		var io_conf = require('./io.js');
		var io = io_conf(io);
	}
	return {"io": io, "app": app}
}
module.exports = main;