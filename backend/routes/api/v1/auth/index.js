var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');
const { redisClient, userKey } = require('../../../../redis');
const { check, body, validationResult } = require('express-validator');
var passport = require('passport');

router.post('/signup', [
	body('username').not().isEmpty().trim(),
	body('password').not().isEmpty().trim()
], function (req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(httpStatus.BAD_REQUEST).json({ errors: errors.array() });
	}
	const { username, password } = req.body;
	redisClient.hgetall(userKey(username), (err, user) => {
		if (err || user) {
			res.statusMessage = "Username taken";
			return res.sendStatus(httpStatus.BAD_REQUEST);
		}
		redisClient.hmset(userKey(username), "username", username, "password", password);
		res.sendStatus(httpStatus.OK);
	});
});

router.post('/login', [
	body('username').not().isEmpty().trim(),
	body('password').not().isEmpty().trim()
], function (req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(httpStatus.BAD_REQUEST).json({ errors: errors.array() });
	}
	passport.authenticate('local', function (err, user) {
		if (err || !user) {
			res.statusMessage = "Login failed";
			return res.sendStatus(httpStatus.BAD_REQUEST);
		}
		req.logIn(user, function (err) {
			if (err) {
				res.statusMessage = "Login failed";
				return res.sendStatus(httpStatus.BAD_REQUEST);
			}
			res.sendStatus(httpStatus.OK);
		});
	})(req, res, next);
});

router.post('/logout', function (req, res) {
	if (req.isAuthenticated()) {
		req.logout();
	}
	res.sendStatus(httpStatus.OK);
});

router.get('/me', function (req, res) {
	if (req.isAuthenticated()) {
		res.json({
			username: req.user.username,
		});
	}
	else {
		res.sendStatus(httpStatus.UNAUTHORIZED);
	}
});

module.exports = router;
