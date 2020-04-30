var express = require('express');
const fetch = require('node-fetch');
const httpStatus = require('http-status-codes')
var router = express.Router();
const { redisClient } = require('../../../../../redis');

const { clientAppId, clientSecret } = process.env;
const myState = 'random_string_shreyas';

router.get('/authorize', function (req, res) {
	const authUrl = 'https://accounts.spotify.com/authorize';
	const scopes = ["user-read-private", "playlist-modify-public", "playlist-read-private", "playlist-modify-private"];
	const params = {
		client_id: clientAppId,
		response_type: 'code',
		redirect_uri: 'http://localhost:3000/api/v1/spotify/auth/callback',
		scope: scopes.join(' '),
		state: myState,
	}
	const urlEncodedBody = Object.keys(params)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');
	res.redirect(`${authUrl}?${urlEncodedBody}`);
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
		redirect_uri: "http://localhost:3000/api/v1/spotify/auth/callback"
	};

	const urlEncodedBody = Object.keys(postBody).map((key) => {
		return encodeURIComponent(key) + '=' + encodeURIComponent(postBody[key]);
	}).join('&');

	fetch(apiTokenUrl, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(clientAppId + ':' + clientSecret).toString('base64')
		},
		method: "POST",
		body: urlEncodedBody
	}).then(async (resp) => {
		const json = await resp.json();
		if (resp.status !== httpStatus.OK) {
			res.status(httpStatus.INTERNAL_SERVER_ERROR).send(`Error in fetching token: ${json.error}`);
			return;
		}
		const { access_token, refresh_token } = json;
		getUser(access_token, (err, user) => {
			if (err) {
				if (err.status === httpStatus.INTERNAL_SERVER_ERROR) {
					res.send(err.status);
					console.log(err.message);
					return;
				}
				res.status(err.status).send(`Error while retrieving user info: ${err.message}`);
				return;
			}
			res.json(user);
			redisClient.set(user.id, JSON.stringify(user));
			redisClient.get(user.id, redis.print);
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


function makePlaylist(playlistName, playlistDesc, userID, access_token) {
	return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
		"headers": {
			"authorization": `Bearer ${access_token}`
		},
		"body": JSON.stringify({
			"name": playlistName,
			"description": playlistDesc,
			"public": false
		}),
		"method": "POST"
	});
}

/*
makePlaylist("Playlist from backend", "Some description", userID, access_token).then(async (resp) => {
	const json = await resp.json();
	if (resp.status !== httpStatus.CREATED) {
		res.status(httpStatus.INTERNAL_SERVER_ERROR).send(`Error while creating playlist : ${json.error.message}`);
		return;
	}
	res.status(httpStatus.OK).send("Successfully made playlist");
})
*/

module.exports = router;
