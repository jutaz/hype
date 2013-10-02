var cluster = require('cluster');
var fs = require('fs');
var cpus = require('os').cpus();
var os = require('os');
var settings = require('settings');
var watch = require('watch');
var path = require('path');
var browserify = require('browserify');
var bower =  require('bower-json');
var compressor = require('node-minify');
var UglifyJS = require("uglify-js");
var sslRuns = 0;
var numberofWorkers = 0;
var packages = [];
var dead_list = [];
var bowerrc;
var starter = {};

starter.init = function(opts) {
	if(!opts.file) {
		throw new Error("No file defined.");
		process.exit(0);
	}
	if(opts.env) {
		options = opts.env;
	} else {
		options = {};
	}
	global.conf = new settings(require(path.normalize(opts.dir+"/conf.json")), options);
	conf.development = (conf.environment == "development");
	bowerrc = JSON.parse(fs.readFileSync(path.normalize(opts.dir+'/.bowerrc')));
	numberofWorkers = (conf.launch_options.workers) ? conf.launch_options.workers : cpus.length;
	cluster.setupMaster({
		exec : path.normalize(opts.file),
		silent : true
	});
	bower(path.normalize(opts.dir+'/bower.json'), function(err, jsonData) {
		for(var i in jsonData.dependencies) {
			packages.push(path.normalize(opts.dir+"/"+bowerrc.directory+"/"+i));
		}
		starter.compile_client_js(packages);
	});
	global.opts = opts;
}

process.on('exit', function() {
	console.log('Shutting down workers.');
	for (var i in cluster.workers){
		cluster.workers[i].destroy();
	}
	console.log('Exiting......');
});

starter.use_ssl = function() {
	sslRuns++;
	if(!conf.ssl || !conf.ssl.key || !conf.ssl.cert || !conf.ports.ssl) {
		return false;
	}
	if(numberofWorkers > 1) {
		if(sslRuns % 2 == 0) {
			return true;
		}
	}
	return false;
}

starter.start = function() {
	for (var i = 0; i < numberofWorkers; i++) {
		cluster.fork({"ssl": starter.use_ssl(), "NODE_ENV": (conf.development) ? "development" : "production"});
	}
	for (var i in cluster.workers){
		cluster.workers[i].process.stdout.on('data', starter.outputData);
		cluster.workers[i].process.stderr.on('data', starter.outputData);
		cluster.workers[i].process.on('error', starter.clusterError);
	}
}

cluster.on('exit', function(worker, code, signal) {
	if (worker.suicide === true) {
		console.log(worker.process.pid+" was restarted due to file update.");
	} else {
		console.log('worker ' + worker.process.pid + ' died');
		starter.add_to_dead_list(worker);
		cluster.fork({"ssl": starter.use_ssl(), "NODE_ENV": (conf.development) ? "development" : "production"});
	}

});

starter.watch = function() {
	watch.createMonitor(opts.dir, function (monitor) {
		monitor.on("created", function (file, stat) {
			if(starter.need_restart(file)) {
				starter.restart_workers();
			}
		})
		monitor.on("changed", function (file, curr, prev) {
			if(starter.need_restart(file)) {
				starter.restart_workers();
			}
		})
		monitor.on("removed", function (file, stat) {
			if(starter.need_restart(file)) {
				starter.restart_workers();
			}
		})
	});

	watch.createMonitor(path.normalize(opts.dir+"/public/"), function (monitor) {
		monitor.on("created", function (file, stat) {
			if(file !== path.normalize(opts.dir+"/public/js/bundle.js")) {
				starter.compile_client_js(packages);
			}
		})
		monitor.on("changed", function (file, curr, prev) {
			if(file !== path.normalize(opts.dir+"/public/js/bundle.js")) {
				starter.compile_client_js(packages);
			}
		})
		monitor.on("removed", function (file, stat) {
			if(file !== path.normalize(opts.dir+"/public/js/bundle.js")) {
				starter.compile_client_js(packages);
			}
		})
	});
}

starter.restart_workers = function(callback) {
	for(var i in cluster.workers) {
		cluster.workers[i].disconnect();
		cluster.workers[i].destroy();
		new_worker = cluster.fork({"ssl": starter.use_ssl(), "NODE_ENV": (conf.development) ? "development" : "production"})
		new_worker.process.stdout.on('data', starter.outputData);
		new_worker.process.stderr.on('data', starter.outputData);
		new_worker.process.on('error', starter.clusterError);
	}
};

starter.outputData = function(chunk) {
	process.stdout.write(""+chunk);
}

starter.clusterError = function(err) {
	process.stderr.write(err);
}

starter.need_restart = function(file) {
	cwd = opts.dir+path.sep;
	paths = [cwd+'main.js', cwd+'public', cwd+'.git']
	for (var i in paths) {
		if(file.startsWith(paths[i])) {
			return false;
		}
	}
	return true;
}

starter.count_dead = function() {
	if(dead_list.length >= 16) {
		process.exit(0);
	} else {
		starter.dead_list = [];
	}
}

starter.add_to_dead_list = function(worker) {
	starter.dead_list.push(worker);
}

starter.compile_client_js = function(scripts) {
	var alljs = [];
	var allJsSrc = [];
	var b = browserify();
	for (var i in scripts) {
		tmp = JSON.parse(fs.readFileSync(scripts[i]+path.sep+"bower.json"));
		if(typeof tmp.main == 'object') {
			for (var e in tmp.main) {
				if(path.extname(tmp.main[e]) == '.js') {
					alljs.push(path.normalize(scripts[i]+path.sep+tmp.main[e]));
				}
			}
		} else {
			alljs.push(path.normalize(scripts[i]+path.sep+tmp.main));
		}
	}
	alljs.push(path.normalize(__dirname+"/public/js/scripts.js"));
	var result = UglifyJS.minify(alljs, {
		outSourceMap: true,
		sourceRoot: "//localhost/js/",
		outSourceMap: path.normalize(__dirname+"/public/js/bundle.js.map"),
	});
	fs.writeFileSync(path.normalize(__dirname+"/public/js/bundle.js"), result.code+"//@ sourceMappingURL=/js/bundle.js.map");
}

setInterval(starter.count_dead, 5000);


String.prototype.startsWith = function (str){
	return this.slice(0, str.length) == str;
};

module.exports = starter;