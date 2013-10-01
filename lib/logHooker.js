var util = require('util');
var db = require('./db').general;
var cluster = require('cluster');
var error_handler = require('./errorHandler');
if(cluster.isMaster) {
	cluster.worker = {
		id: ""
	};
}
global.console.log = function() {
	if(conf.development) {
		process.stdout.write(util.format.apply(this, arguments) + '\n');
	} else {
		var data_to_write = arguments;
		process.nextTick(function() {
			data = {data: JSON.stringify(data_to_write), type: 'console.log', cluster_id: cluster.worker.id};
			db.collection('logs').insert(data, function(err) {
				if(err) {
					error_handler.mongo(err);
				}
			});
		});
	}
}

global.console.info = global.console.log;


global.console.warn = function() {
	if(conf.development) {
		process.stderr.write(util.format.apply(this, arguments) + '\n');
	} else {
		var data_to_write = arguments;
		process.nextTick(function() {
			data = {data: JSON.stringify(data_to_write), type: 'console.warn', cluster_id: cluster.worker.id};
			db.collection('logs').insert(data, function(err) {
				if(err) {
					error_handler.mongo(err);
				}
			});
		});
	}
};

global.console.error = global.console.warn;