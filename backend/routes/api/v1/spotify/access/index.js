var express = require('express');
const httpStatus = require('http-status-codes');
const fetch = require('node-fetch');
var router = express.Router();
var { redisClient, spotifyCredKey, spotifyAccessTokenKey } = require('../../../../../redis');
const { body, validationResult } = require('express-validator');
const {refreshAuthToken} = require("./refresh_token")

function makePlaylist({ playlistName, playlistDesc }, spotify_id, access_token, callback) {
	fetch(`https://api.spotify.com/v1/users/${spotify_id}/playlists`, {
		"headers": {
			"authorization": `Bearer ${access_token}`
		},
		"body": JSON.stringify({
			"name": playlistName,
			"description": playlistDesc,
			"public": false
		}),
		"method": "POST"
	}).then(async (resp) => {
		const json = await resp.json();
		if (resp.status !== httpStatus.CREATED) {
			callback(json.error, null);
		}
		else callback(null, json);
	})
		.catch(err => callback({ status: httpStatus.INTERNAL_SERVER_ERROR, message: err }, null));
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

		redisClient.hgetall(spotifyCredKey(req.user.username), async (err, user) => {
			if (err) {
				res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
				console.log(`Error while retrieving spotify credentials: ${err}`);
				return;
			}

			redisClient.get(spotifyAccessTokenKey(req.user.username), (err, access_token) => {
				
				if (!access_token) {
					refreshAuthToken(user.refresh_token,async(err, resp) => {
						if (err) {
							res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
							console.log(`Error while refreshing token ${err.message}`);
							return;
						}
						else {
							await redisClient.set(spotifyAccessTokenKey(req.user.username), resp.access_token, "EX", resp.expires_in);
							makePlaylist(req.body, user.spotify_id, resp.access_token, (err, resp) => {
								if (err) {
									res.sendStatus(err.status);
									console.log(`Error while creating playlist : ${err.message}`);
									return;
								}
								else res.status(httpStatus.OK).send("Successfully made playlist");
			
							});			
						}

					})
				}
				else {
					makePlaylist(req.body, user.spotify_id, access_token, (err, resp) => {
						if (err) {
							res.sendStatus(err.status);
							console.log(`Error while creating playlist : ${err.message}`);
							return;
						}
						else res.status(httpStatus.OK).send("Successfully made playlist");
	
					});	
				}
			});
		})
	});

module.exports = router;