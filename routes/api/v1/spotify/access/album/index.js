var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const Spotify = require("../../../../../../service_managers/spotify")

router.get('/:albumId', function (req, res) {
    if (!req.params.albumId) {
		res.status(httpStatus.BAD_GATEWAY).send(" Must send the albumID");
		return;
    }
    
	const spotify = new Spotify(req);
	spotify.getAlbum(req.params.albumId, (err, resp) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(`Error while fetching album: ${err.message}`);
			return;
		}
		else res.status(httpStatus.OK).json(resp);
	});
});

module.exports = router;