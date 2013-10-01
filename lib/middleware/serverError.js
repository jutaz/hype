module.exports = function(err, req, res, next){
	if(!res.locals.pjax) {
		res.status(500);
	} else  {
		res.locals.statusCode(500);
	}
	res.render('500');
	error.core(err);
	res.locals.error = err;
}
