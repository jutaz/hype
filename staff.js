var middleware = require("./lib/middleware");
var routes = require('./routes/main');

module.exports = function(app) {
	app.get('/staff/mission-control/activate', middleware.auth.staff, routes.staff.mission_control_activate);
	app.get('/staff/mission-control/deactivate', middleware.auth.staff, routes.staff.mission_control_deactivate);
	app.get('/staff/mission-control/toggle', middleware.auth.staff, routes.staff.mission_control_toggle);
	app.all('/staff/mission-control/bar/:id', middleware.auth.staff, routes.staff.bar);
	return app;
}