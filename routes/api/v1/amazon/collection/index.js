var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');

router.get('/', function (req, res) {
	res.sendStatus(httpStatus.OK);
});

router.post('/', function (req, res) {
	res.sendStatus(httpStatus.OK);
});

router.get('/hash', function (req, res) {
	res.sendStatus(httpStatus.OK);
});

module.exports = router;
