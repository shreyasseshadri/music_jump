var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const Spotify = require("../../../../../../service_managers/spotify");

router.get('/:playlistId', function (req, res) {
	if (!req.params.playlistId) {
		res.status(httpStatus.BAD_GATEWAY).send(" Must send the playlisyID");
		return;
	}

	const spotify = new Spotify(req);
	spotify.getPlaylist(req.params.playlistId, (err, resp) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(`Error while getting playlist : ${err.message}`);
			return;
		}
		else res.status(httpStatus.OK).json(resp);
	});
});

router.post('/', [
	body('playlistName').not().isEmpty().trim(),
	body('playlistDesc').not().isEmpty().trim()
]
	, function (req, res) {

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(httpStatus.BAD_REQUEST).json({ errors: errors.array() });
		}

		const spotify = new Spotify(req);
		spotify.makePlaylist(req.body, (err, resp) => {
			if (err) {
				res.sendStatus(err.status);
				console.log(`Error while creating playlist : ${err.message}`);
				return;
			}
			else res.status(httpStatus.OK).json({ succes: true, playlistID: resp.id });
		});
	});

module.exports = router;