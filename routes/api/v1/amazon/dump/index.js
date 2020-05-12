var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');
const Amazon = require('../../../../../service_managers/amazon');


router.get('/', function (req, res) {
	res.sendStatus(httpStatus.NOT_IMPLEMENTED);
});

router.post('/', function (req, res) {
	const amz = new Amazon(req);
	amz.importDump(req.body, (err) => {
		if (err) {
			res.statusMessage = err.message;
			res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
		}
		else {
			res.sendStatus(httpStatus.OK);
		}
	});
});

router.get('/hash', function (req, res) {
	res.sendStatus(httpStatus.NOT_IMPLEMENTED);
});

module.exports = router;
