var express = require('express');
var router = express.Router({ mergeParams: true });
const httpStatus = require('http-status-codes');
const Amazon = require('../../../../../service_managers/amazon');

router.get('/', function (req, res) {
	const amz = new Amazon(req);
	amz.getAlbum(req.params.id, (err, data) => {
		if (err) {
			res.statusMessage = err.message;
			res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
		}
		else {
			res.json(data);
		}
	});
});

router.post('/', function (req, res) {
	res.sendStatus(httpStatus.NOT_IMPLEMENTED);
});

router.get('/hash', function (req, res) {
	res.sendStatus(httpStatus.NOT_IMPLEMENTED);
});

module.exports = router;
