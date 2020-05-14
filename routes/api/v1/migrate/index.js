var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const Spotify = require("../../../../service_managers/spotify");
const Amazon = require("../../../../service_managers/amazon")

const nameToServiceClass = {
	'spotify': Spotify,
	'amazon': Amazon
}

router.post('/', [
	body('toServiceName').not().isEmpty().trim(), //TODO: assert if values are valid services, types etc.
	body('fromServiceName').not().isEmpty().trim(),
	body('migrationType').not().isEmpty().trim(),
	body('migrationData').not().isEmpty().trim(),
], async function (req, res) {

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(httpStatus.BAD_REQUEST).json({ errors: errors.array() });
	}

	const { toServiceName, fromServiceName, migrationType, migrationData } = req.body;

	const toService = new nameToServiceClass[toServiceName](req);
	const fromService = new nameToServiceClass[fromServiceName](req);

	if (!await toService.isAuth()) {
		res.status(httpStatus.UNAUTHORIZED).send(`${toServiceName} not authenticated`);
		return;
	}
	if (!fromService.isAuth()) {
		res.status(httpStatus.UNAUTHORIZED).send(`${fromServiceName} not authenticated`);
		return;
	}

	toService.migrate(migrationData, migrationType, (err, resp) => {
		if (err) {
			res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
			console.log(err.message);
		}
		else {
			res.status(httpStatus.OK).json(resp);
		}

	});
});

module.exports = router;