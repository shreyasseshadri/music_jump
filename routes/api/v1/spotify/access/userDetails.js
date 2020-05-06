const httpStatus = require('http-status-codes');
const { urlEncodedBody, customFetch } = require('../../../../../helpers');
const { clientAppId, clientSecret } = process.env;
const { redisClient, spotifyAccessTokenKey, spotifyCredKey } = require("../../../../../redis");

function fetchDetails(username, callback) {
	redisClient.hgetall(spotifyCredKey(username), (err, user) => {
		if (err) {
			callback({
				status: httpStatus.INTERNAL_SERVER_ERROR,
				message: `Error while retrieving spotify credentials: ${err}`
			}, null);
			return;
		}

		getToken(username, user.refresh_token, (err, access_token) => {
			if (access_token) {
				callback(null, { user, access_token });
			}
			else {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: `Error while custom token fetch ${err.message}`
				}, null);
			}
		});
	});
}

function getToken(username, refresh_token, callback) {
	redisClient.hgetall(spotifyAccessTokenKey(username), (err, access_token) => {
		if (!access_token) {
			refreshAuthToken(refresh_token, async (err, resp) => {
				if (err) {
					callback({ status: httpStatus.INTERNAL_SERVER_ERROR, message: `Error while refreshing token ${err.message}` }, null)
				}
				else {
					await redisClient.set(spotifyAccessTokenKey(username), resp.access_token, "EX", resp.expires_in);
					callback(null, resp.access_token);
				}

			})
		}
		else callback(null, access_token);
	});
}

function refreshAuthToken(refreshToken, callback) {
	var postBody = {
		grant_type: "refresh_token",
		refresh_token: refreshToken
	}

	var fetchOptions = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(clientAppId + ':' + clientSecret).toString('base64')
		},
		method: "POST",
		body: urlEncodedBody(postBody)
	}

	customFetch("https://accounts.spotify.com/api/token", fetchOptions, httpStatus.OK, callback);
}

module.exports = { fetchDetails };