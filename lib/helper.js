var helper = {};

helper.generateStatusStringFromErrors = function(err, callback) {
	var status = "";
	if(err) {
		for (var i in err) {
			if(i > 0) {
				status = status+";"+err[i].msg;
			} else {
				status = status+err[i].msg;
			}
		}
		callback(true, status);
	} else {
		callback(false);
	}
}

module.exports = helper;