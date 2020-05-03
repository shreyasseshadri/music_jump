var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');

router.use('/v1', require('./v1'));
router.use(function (_, res) {
	res.sendStatus(httpStatus.NOT_FOUND);
})

module.exports = router;
