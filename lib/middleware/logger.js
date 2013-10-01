var db = require('../db').general;
var cluster = require('cluster');
var clc = require('cli-color');

module.exports = function(req, res, next) {
	req._startTime = new Date;
	var end = res.end;
	res.locals.request_id = db.ObjectId();
	res.setHeader("Request-Id", res.locals.request_id);
	res.end = function(chunk, encoding) {
		res.end = end;
		if(req.route && (req.headers["x-requested-with"] !== "XMLHttpRequest" && !res.locals.pjax)) {
			req.session.req_id = res.locals.request_id;
		}
		res.end(chunk, encoding);
		var time = new Date;
		// there`s no need to log cssRefresh requests
		if(req.query.cssrefresh) {
			return;
		}
		data = {
			_id: db.ObjectId(res.locals.request_id),
			method: req.method,
			url: req.originalUrl || req.url,
			pathname: req._parsedUrl.pathname,
			query: req.query,
			req_headers: req.headers,
			res_headers: res._headers,
			http_version: req.httpVersion,
			status_code: (res.locals.statusCode && req.headers["x-pjax"]) ? res.locals.statusCode : res.statusCode,
			pjax: (req.headers["x-pjax"]) ? true : false,
			cluster_id: cluster.worker.id,
			time: (time-req._startTime),
			request_date: req._startTime,
			res_size: (res.getHeader('Content-Length')) ? parseInt(res.getHeader('Content-Length'), 10) : 0
		}
		if(res.locals.error) {
			data.error = {
				error: res.locals.error,
				stack: res.locals.error.stack
			};
		}
		if(req.route) {
			data.type = "web_request";
		} else {
			if(req.session.req_id) {
				data.assoc_req_id = req.session.req_id;
			} else {
				data.assoc_req_id = false;
			}
			data.type = "static_asset";
		}
		db.collection('perf').insert(data, function(err) {

		});
		if(conf.development) {
			if(data.status_code > 100 && data.status_code < 300) {
				code = clc.greenBright(data.status_code);
			} else if(data.status_code > 300 && data.status_code < 400) {
				code = clc.yellowBright(data.status_code);
			} else if(data.status_code > 400 && data.status_code < 500) {
				code = clc.blueBright(data.status_code);
			} else if(data.status_code > 500 && data.status_code < 600) {
				code = clc.redBright(data.status_code);
			} else {
				code = data.status_code;
			}
			if(data.res_size) {
				size = "- "+data.res_size+" Kb";
			} else {
				size = "";
			}
			if(res.locals.pjax) {
				isPjax = clc.magentaBright(" pjax=true");
			} else {
				isPjax = "";
			}
			console.log(clc.blackBright(data.method+" "+data.url+" ")+code+" "+clc.blackBright(data.time+"ms "+size)+isPjax);
		}
	};
	next();
}