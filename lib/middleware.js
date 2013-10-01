var middleware = {};

middleware.auth = require("./middleware/auth");
middleware.nav = require("./middleware/nav");
middleware.session = require("./middleware/session");
middleware.logger = require("./middleware/logger");
middleware.pjax = require("./middleware/pjax");
middleware.user = require("./middleware/user");
middleware.serverError = require("./middleware/serverError");


module.exports = middleware;