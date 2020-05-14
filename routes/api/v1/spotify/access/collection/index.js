var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const Spotify = require("../../../../../../service_managers/spotify")

router.get('/', function (req, res) {

	const spotify = new Spotify(req);
	spotify.getCollection((err, resp) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(err.message);
			return;
		}
		else res.status(httpStatus.OK).json(resp);
	});
});

module.exports = router;