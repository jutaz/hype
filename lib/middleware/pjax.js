module.exports = function(req, res, next) {
	if(req.headers["x-pjax"]) {
		res.locals.pjax = true;
	} else {
		res.locals.pjax = false;
	}
	next();
}