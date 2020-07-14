var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');
const { redisClient, userKey } = require('../../../../redis');
const { check, body, validationResult } = require('express-validator');
var passport = require('passport');
const { serviceClasses, supportedServices } = require("../../../../service_managers");

router.post('/signup', [
	body('username').not().isEmpty().withMessage('invalid username').trim(),
	body('password').not().isEmpty().withMessage('invalid password').trim()
], function (req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.statusMessage = errors.array().map(e => e.msg).join(', ');
		return res.sendStatus(httpStatus.BAD_REQUEST);
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
	body('username').not().isEmpty().withMessage('invalid username').trim(),
	body('password').not().isEmpty().withMessage('invalid password').trim()
], function (req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.statusMessage = errors.array().map(e => e.msg).join(', ');
		return res.sendStatus(httpStatus.BAD_REQUEST);
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
		const host = `http://localhost:${process.env.PORT}`;
		const services = supportedServices.map((service) => new serviceClasses[service](req));
		const authPromises = services.map((service) => service.isAuth());

		Promise.all(authPromises)
		.then((auths) => {
			const response = {
				username: req.user.username,
				services: supportedServices.map((service,index) => ({
					id: service,
					type: 'service',
					title: services[index].getTitle(),
					Connected: auths[index],
					thumb: `${host}/images/service_logos/${service}.png`
				}))
			};
			res.status(httpStatus.OK).json(response);
		})
		.catch(err => {
			console.log(err);
			res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
		});
	}
	else {
		res.sendStatus(httpStatus.UNAUTHORIZED);
	}
});

module.exports = router;
