var express = require('express');
const httpStatus = require('http-status-codes');
const fetch = require('node-fetch');
var router = express.Router();
var { redisClient, spotifyCredKey, spotifyAccessTokenKey } = require('../../../../../redis');
const { body, validationResult } = require('express-validator');
const { getToken } = require("./token")
const { customFetch, urlEncodedBody } = require("../../../../../helpers")

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

router.post('/makePlaylist', [
	body('playlistName').not().isEmpty().trim(),
	body('playlistDesc').not().isEmpty().trim()
]
	, function (req, res) {

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(httpStatus.BAD_REQUEST).json({ errors: errors.array() });
		}

		redisClient.hgetall(spotifyCredKey(req.user.username), (err, user) => {
			if (err) {
				res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
				console.log(`Error while retrieving spotify credentials: ${err}`);
				return;
			}

			getToken(req.user.username,user.refresh_token,(err,access_token) => {
				if(access_token){
					makePlaylist(req.body, user.spotify_id, access_token, (err, resp) => {
						if (err) {
							res.sendStatus(err.status);
							console.log(`Error while creating playlist : ${err.message}`);
							return;
						}
						else res.status(httpStatus.OK).send("Successfully made playlist");
					});
				}
				else {
					req.sendStatus(err.status);
					console.log(err.message);
					return;
				}
			});
		})
	});

module.exports = router;