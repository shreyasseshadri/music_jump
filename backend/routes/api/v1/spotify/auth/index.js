var express = require('express');
const fetch = require('node-fetch');
const httpStatus = require('http-status-codes')
var router = express.Router();

const { clientAppId, clientSecret } = process.env;
const myState = 'random_string_shreyas'
const userID = 'ttx1gpej20552zpv12kplq0ky'

router.get('/authorize', function (req, res) {
	const authUrl = 'https://accounts.spotify.com/authorize';
	const params = {
		client_id: clientAppId,
		response_type: 'code',
		redirect_uri: 'http://localhost:3000/api/v1/spotify/auth/callback',
		scope: "user-read-private playlist-modify-public playlist-read-private playlist-modify-private",
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
			res.json(user);
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
		.then(r => r.json())
		.then(user => callback(null, user))
		.catch(e => callback(e, null));
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
