var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { urlEncodedBody } = require("../../../../../../helpers");
const Spotify = require("../../../../../../service_managers/spotify")

router.get('/', function (req, res) {

	const spotify = new Spotify(req);
	spotify.search(urlEncodedBody(req.query), (err, resp) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(`Error while searching: ${err.message}`);
			return;
		}
		else res.status(httpStatus.OK).json(resp);
	});
});

module.exports = router;