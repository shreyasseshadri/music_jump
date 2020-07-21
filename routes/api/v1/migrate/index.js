var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult, oneOf } = require('express-validator');
const { serviceClasses, supportedServices } = require("../../../../service_managers");

const supportedMigrationTypes = ["album", "playlist"];

router.post('/', [
	body('toServiceName').not().isEmpty().trim().isIn(supportedServices),
	body('fromServiceName').not().isEmpty().trim().isIn(supportedServices),
	body('migrationType').not().isEmpty().trim().isIn(supportedMigrationTypes),
	body('migrationData').not().isEmpty().withMessage("Must contain migration Data")
], oneOf([
	[	//Incase of Album
		body('migrationType').equals("album"),
		body('migrationData.albumName').not().isEmpty().withMessage("Must Contain abum name")
	],
	[	//Incase of Playlist
		body('migrationType').equals("playlist"),
		body('migrationData.playlistName').not().isEmpty().withMessage("Must Contain playlist name"),
		body('migrationData.songs').not().isEmpty().isArray({ min: 1 }).withMessage("Songs Must be an array with size > 1"),
		body('migrationData.songs.*.name').not().isEmpty().isString().withMessage("Song name must be a string")
	]
]), async function (req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.statusMessage = errors.array().map(e => e.msg).join(', ');
		return res.sendStatus(httpStatus.BAD_REQUEST);
	}

	const { toServiceName, fromServiceName, migrationType, migrationData } = req.body;

	const toService = new serviceClasses[toServiceName](req);
	const fromService = new serviceClasses[fromServiceName](req);

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
			res.sendStatus(err.status);
			console.log(err.message);
		}
		else {
			res.status(httpStatus.OK).json(resp);
		}

	});
});

module.exports = router;