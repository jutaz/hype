var perf_model = require('../models/perf');
var staff = {};

staff.mission_control_activate = function(req, res) {
	req.session.mission_control = true;
	res.json({success: true});
}

staff.mission_control_deactivate = function(req, res) {
	req.session.mission_control = false;
	res.json({success: true});
}

staff.mission_control_toggle = function(req, res) {
	if(req.session.mission_control) {
		req.session.mission_control = false;
	} else {
		req.session.mission_control = true;
	}
	res.json({
		success: true,
		bar: req.session.mission_control
	});
}

staff.bar = function(req, res) {
	if(req.body) {
		var timing = req.body;
		var userTime = timing.loadEventEnd - timing.navigationStart;
		var dns = timing.domainLookupEnd - timing.domainLookupStart;
		var conn = timing.connectEnd - timing.connectStart;
		var requestTime = timing.responseEnd - timing.requestStart;
		var fetchTime = timing.responseEnd - timing.fetchStart;
		var sending = fetchTime - requestTime;
		var total = dns+conn+fetchTime;
		metrics = {
			request: {
				percentage: ((fetchTime/total)*100),
				ms: fetchTime
			},
			connection: {
				percentage: ((conn/total)*100),
				ms: conn
			},
			dns: {
				percentage: ((dns/total)*100),
				ms: dns
			}
		};
	} else {
		metrics = false;
	}
	perf_model.get_request(req.params.id, function(err, data) {
		if(err) {
			throw new Error(err);
			return;
		}
		res.render('staff/bar', {perf: data, timelineMetrics: metrics});
	});
}

module.exports = staff;