var middleware = require("./lib/middleware");
var routes = require('./routes/main');

module.exports = function(app) {
	app.post('/log/error', routes.log_error);
	app.all('*', routes.error_404);
	app.use(middleware.serverError);
	return app;
}