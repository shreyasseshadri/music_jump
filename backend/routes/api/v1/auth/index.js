var express = require('express');
const fetch = require('node-fetch');
const httpStatus = require('http-status-codes')
var router = express.Router();

/* GET home page. */

const { clientAppId, clientSecret } = process.env;
// console.log(clientAppId,clientSecret);
const myState = 'random_string_shreyas'
const clientID = 'ttx1gpej20552zpv12kplq0ky'

const makePlaylist = (playlistName, playlistDesc, clientID, access_token) => {

	return fetch(`https://api.spotify.com/v1/users/${clientID}/playlists`, {
		"headers": {
			"authorization": `Bearer ${access_token}`
		},
		"body": JSON.stringify({
			"name": playlistName,
			"description": playlistDesc,
			"public": false
		}),
		"method": "POST"
	})
}

router.get('/test', function (req, res) {
	res.sendStatus(httpStatus.OK);
})

router.get('/spotify', function (req, res) {

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
		redirect_uri: "http://localhost:3000/api/v1/auth/spotify"
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

		makePlaylist("Playlist from backend", "Some description", clientID, access_token).then(async (resp) => {
			const json = await resp.json();
			if (resp.status !== httpStatus.CREATED) {
				res.status(httpStatus.INTERNAL_SERVER_ERROR).send(`Error while creating playlist : ${json.error.message}`);
				return;
			}
			res.status(httpStatus.OK).send("Successfully made playlist");
		})

	});

});

module.exports = router;
