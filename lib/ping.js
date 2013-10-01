var user_model = require('../models/users');
var users = {};

module.exports = function(socket) {
	if(!users[socket.handshake.session.userID]) {
		users[socket.handshake.session.userID] = {};
		users[socket.handshake.session.userID].online = true;
		users[socket.handshake.session.userID].reconnecting = false;
		users[socket.handshake.session.userID].id = socket.handshake.session.userID;
		user_model.set_online(socket.handshake.session.userID, function() {
			users[socket.handshake.session.userID].timer = function(userId) {
				if(users[userId]) {
					clearInterval(socket.interval);
				} else {
					user_model.set_offline(userId, function() {});
				}
			}
		});
	}
	socket.on('disconnect', function() {
		socket.interval = setTimeout(users[socket.handshake.session.userID].timer, 5000, socket.handshake.session.userID);
		delete users[socket.handshake.session.userID];
	});
}