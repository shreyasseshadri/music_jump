var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const { fetchDetails } = require("../userDetails")
const { customFetch } = require("../../../../../../helpers")

function makePlaylist({ playlistName, playlistDesc }, spotify_id, access_token, callback) {
	var fetchOptions = {
		"headers": {
			"authorization": `Bearer ${access_token}`
		},
		"body": JSON.stringify({
			"name": playlistName,
			"description": playlistDesc,
			"public": false
		}),
		"method": "POST"
	}
	customFetch(`https://api.spotify.com/v1/users/${spotify_id}/playlists`, fetchOptions, httpStatus.CREATED, callback);
}

function getPlaylist(playlistId, access_token, callback) {
	var fetchOptions = {
		"headers": {
			"authorization": `Bearer ${access_token}`
		}
	}
	customFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, fetchOptions, httpStatus.OK, callback);
}

router.get('/:playlistId', function (req, res) {
	if (!req.params.playlistId) {
		res.status(httpStatus.BAD_GATEWAY).send(" Must send the playlisyID");
		return;
	}

	fetchDetails(req.user.username, (err, { user, access_token }) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(err.message);
			return;
		}
		getPlaylist(req.params.playlistId, access_token, (err, resp) => {
			if (err) {
				res.sendStatus(err.status);
				console.log(`Error while getting playlist : ${err.message}`);
				return;
			}
			else res.status(httpStatus.OK).json(resp);
		});

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

		fetchDetails(req.user.username, (err, { user, access_token }) => {
			if (err) {
				res.sendStatus(err.status);
				console.log(err.message);
				return;
			}
			makePlaylist(req.body, user.spotify_id, access_token, (err, resp) => {
				if (err) {
					res.sendStatus(err.status);
					console.log(`Error while creating playlist : ${err.message}`);
					return;
				}
				else res.status(httpStatus.OK).send("Successfully made playlist");
			});

		});
	});

module.exports = router;