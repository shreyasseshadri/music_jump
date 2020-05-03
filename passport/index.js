var passport = require('passport');
var Strategy = require('passport-local').Strategy;
const { redisClient, userKey } = require('../redis');

passport.use(new Strategy(
	function (username, password, done) {
		redisClient.hgetall(userKey(username), (err, user) => {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (user.password !== password) { return done(null, false); }
			return done(null, user);
		});
	}
));

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(function (username, done) {
	redisClient.hgetall(userKey(username), (err, user) => done(err, { username: user.username }));
});