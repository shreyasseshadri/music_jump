var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');

router.use('/auth', require('./auth'));
router.use(function (req, res, next) {
	if (req.isAuthenticated()) {
		next();
	}
	else {
		res.sendStatus(httpStatus.UNAUTHORIZED);
	}
});
router.use('/spotify', require('./spotify'));

module.exports = router;
