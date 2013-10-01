var objectId = require('objectid');
var user_model = require('../../models/users');

module.exports = function(req, res, next) {
	req.user = res.locals.user = false;
	res.locals.mission_control = false;
	if(req.session.loggedIn && objectId.isValid(req.session.userID)) {
		user_model.get(req.session.userID, function(err, results) {
			if(err) {
				next();
				return false;
			}
			if(results.length < 1) {
				next();
				return false;
			}
			res.locals.user = req.user = results[0];
			res.locals.mission_control = req.session.mission_control || false;
			next();
		});
	} else {
		next();
	}
}