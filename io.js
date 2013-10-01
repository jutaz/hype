var RedisStore = require('socket.io/lib/stores/redis');
var redis  = require('socket.io/node_modules/redis');
var pub    = redis.createClient();
var sub    = redis.createClient();
var client = redis.createClient();
var middleware = require("./lib/middleware");

module.exports = function(io) {
	io.set('store', new RedisStore({
		redisPub : pub,
		redisSub : sub,
		redisClient : client
	}));
	io.configure('production',function() {
		io.enable('browser client etag');
		io.enable('browser client minification');
		io.enable('browser client gzip');
	});
	io.set('authorization', middleware.auth.socket);
	return io;
}