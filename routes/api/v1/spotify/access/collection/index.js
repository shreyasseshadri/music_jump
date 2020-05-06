var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const { fetchDetails } = require("../userDetails")
const { customFetch } = require("../../../../../../helpers")

function getAllAlbums(access_token, callback) {
	var fetchOptions = {
		"headers": {
			"authorization": `Bearer ${access_token}`
		}
	}
	customFetch("https://api.spotify.com/v1/me/albums", fetchOptions, httpStatus.OK, callback);
}

function getAllPlaylists(access_token, callback) {
	var fetchOptions = {
		"headers": {
			"authorization": `Bearer ${access_token}`
		}
	}
	customFetch("https://api.spotify.com/v1/me/playlists", fetchOptions, httpStatus.OK, callback);
}

router.get('/', function (req, res) {
	fetchDetails(req.user.username, (err, { user, access_token }) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(err.message);
			return;
		}
		getAllAlbums(access_token, (err, albums) => {
			if (err) {	
				res.sendStatus(err.status);
				console.log(`Error while getting all albums : ${err.message}`);
				return;
			}
			else {
				getAllPlaylists(access_token,(err,playlists) => {
					if (err) {
						res.sendStatus(err.status);
						console.log(`Error while getting all albums : ${err.message}`);
						return;
					}
					else res.status(httpStatus.OK).json({albums,playlists});
				});
			}
		});
	});

});

module.exports = router;