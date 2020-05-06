var express = require('express');
const fetch = require('node-fetch');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { urlEncodedBody } = require('../../../../../helpers');
const { redisClient, spotifyCredKey, spotifyAccessTokenKey } = require('../../../../../redis');

const { clientAppId, clientSecret } = process.env;
const myState = 'random_string_shreyas';

router.get('/authorize', function (req, res) {
	const authUrl = 'https://accounts.spotify.com/authorize';
	const scopes = ["user-read-private", "playlist-modify-public", "playlist-read-private", "playlist-modify-private","user-library-read"];
	const params = {
		client_id: clientAppId,
		response_type: 'code',
		redirect_uri: 'http://localhost:5000/api/v1/spotify/auth/callback',
		scope: scopes.join(' '),
		state: myState,
	}
	res.redirect(`${authUrl}?${urlEncodedBody(params)}`);
});

router.get('/callback', function (req, res) {
	var state = req.query.state;
	if (state !== myState) {
		res.status(httpStatus.UNAUTHORIZED).send("States did not match");
		return;
	}
	if (req.query.error) {
		res.status(httpStatus.UNAUTHORIZED).send(req.query.error);
		return;
	}
	var code = req.query.code;
	if (!code) {
		res.status(httpStatus.BAD_REQUEST).send("Code must be passed");
		return;
	}

	const apiTokenUrl = 'https://accounts.spotify.com/api/token';
	const postBody = {
		grant_type: "authorization_code",
		code: code,
		redirect_uri: "http://localhost:5000/api/v1/spotify/auth/callback"
	};

	fetch(apiTokenUrl, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(clientAppId + ':' + clientSecret).toString('base64')
		},
		method: "POST",
		body: urlEncodedBody(postBody)
	}).then(async (resp) => {
		const json = await resp.json();
		if (resp.status !== httpStatus.OK) {
			res.status(httpStatus.INTERNAL_SERVER_ERROR).send(`Error in fetching token: ${json.error}`);
			return;
		}
		const { access_token, refresh_token, expires_in } = json;
		getUser(access_token, (err, user) => {
			if (err) {
				if (err.status === httpStatus.INTERNAL_SERVER_ERROR) {
					res.sendStatus(err.status);
					console.log(err.message);
					return;
				}
				res.status(err.status).send(`Error while retrieving user info: ${err.message}`);
				return;
			}
			redisClient.hmset(spotifyCredKey(req.user.username), "spotify_id", user.id, "refresh_token", refresh_token,
				(err) => {
					if (err) {
						res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
						console.log(err);
						return;
					}
					else {
						redisClient.set(spotifyAccessTokenKey(req.user.username), access_token, 'EX', expires_in, (err) => {
							if (err) {
								console.log(err);
								res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
								return;
							}
						});
						res.json(user);
					}
				});
		});
	});

});

function getUser(access_token, callback) {
	return fetch(`https://api.spotify.com/v1/me`, {
		"headers": {
			"authorization": `Bearer ${access_token}`
		},
		"method": "GET"
	})
		.then(async (resp) => {
			const json = await resp.json();
			if (resp.status !== httpStatus.OK) {
				callback(json.error, null);
			}
			else callback(null, json);
		})
		.catch((e) => callback({ status: httpStatus.INTERNAL_SERVER_ERROR, message: e.message }, null));
}

module.exports = router;
