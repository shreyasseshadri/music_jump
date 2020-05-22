const { fetchDetails } = require("./fetchUser");
const httpStatus = require('http-status-codes');
const { customFetch, urlEncodedBody } = require("../../helpers");
const { redisClient, spotifyCredKey } = require('../../redis');


class Spotify {
	constructor(req) {
		this.username = req.user.username;
	}

	async isAuth() {
		return new Promise((resolve, reject) => {
			redisClient.exists(spotifyCredKey(this.username), (err, reply) => {
				if (err) {
					reject(err);
				}
				if (reply === 1) {
					resolve(true);
				}
				else {
					reject(false);
				}
			})

		})
	}

	getPlaylist(playlistId, callback) {

		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
				var fetchOptions = {
					"headers": {
						"authorization": `Bearer ${access_token}`
					}
				}
				customFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, fetchOptions, httpStatus.OK, callback);
			}
		});
	}

	makePlaylist({ playlistName, playlistDesc }, callback) {

		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
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
				customFetch(`https://api.spotify.com/v1/users/${user.spotify_id}/playlists`, fetchOptions, httpStatus.CREATED, callback);
			}
		});
	}

	getAllPlaylists(access_token, callback) {
		var fetchOptions = {
			"headers": {
				"authorization": `Bearer ${access_token}`
			}
		}
		customFetch("https://api.spotify.com/v1/me/playlists", fetchOptions, httpStatus.OK, callback);
	}

	getAllAlbums(access_token, callback) {
		var fetchOptions = {
			"headers": {
				"authorization": `Bearer ${access_token}`
			}
		}
		customFetch("https://api.spotify.com/v1/me/albums", fetchOptions, httpStatus.OK, callback);
	}

	getCollection(callback) {

		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
				this.getAllAlbums(access_token, (err, albums) => {
					if (err) {
						callback({
							status: httpStatus.INTERNAL_SERVER_ERROR,
							message: `Error while fetching albums: ${err}`
						}, null);
					}
					else {
						this.getAllPlaylists(access_token, (err, playlists) => {
							if (err) {
								callback({
									status: httpStatus.INTERNAL_SERVER_ERROR,
									message: `Error while fetching playlists: ${err}`
								}, null);
							}
							else callback(null, { albums, playlists });
						});
					}
				});
			}
		});
	}

	search(query, callback) {
		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
				var fetchOptions = {
					"headers": {
						"authorization": `Bearer ${access_token}`
					}
				}
				customFetch(`https://api.spotify.com/v1/search?${query}`, fetchOptions, httpStatus.OK, callback);
			}
		});
	}

	getAlbum(albumId, callback) {

		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
				var fetchOptions = {
					"headers": {
						"authorization": `Bearer ${access_token}`
					}
				}
				customFetch(`https://api.spotify.com/v1/albums/${albumId}`, fetchOptions, httpStatus.OK, callback);
			}
		});
	}

	nameToId(name, type, callback) {

		const searchType = (type === 'playlist') ? 'track' : type;
		const searchQuery = urlEncodedBody({
			q: name,
			type: searchType,
			limit: 1
		})

		this.search(searchQuery, (err, resp) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: `Error while searching ${searchType} ID: ${err}`
				}, null)
			}
			else if (resp.albums.items.length < 1) {
				callback({
					status: httpStatus.BAD_REQUEST,
					message: `Search returned no results: ${err}`
				}, null)
			}
			else {
				const resultItem = resp.albums.items[0];
				if (!resultItem.id) {
					callback({
						status: httpStatus.INTERNAL_SERVER_ERROR,
						message: `${searchType} ID not found`
					}, null)
				}
				else {
					callback(null, resultItem.id);
				}
			}
		});

	}

	migrate(migrateData, migrateType, callback) {
		switch (migrateType) {
			case "album": {
				this.migrateAlbum(migrateData, migrateType, callback);
				break
			}
			case "playlist": {
				break
			}
		}
	}

	migrateAlbum(albumName, type, callback) {

		this.nameToId(albumName, type, (err, albumId) => {

			this.addAlbum(albumId, (err, resp) => {
				if (err) {
					callback({
						status: httpStatus.INTERNAL_SERVER_ERROR,
						message: err
					}, null);
				}
				else {
					callback(null, resp);
				}
			})
		})
	}

	addAlbum(albumId, callback) {

		fetchDetails(this.username, (err, { user, access_token }) => {
			if (err) {
				callback({
					status: httpStatus.INTERNAL_SERVER_ERROR,
					message: err
				}, null);
			}
			else {
				var fetchOptions = {
					"headers": {
						"authorization": `Bearer ${access_token}`
					},
					"method": "PUT"
				}
				customFetch(`https://api.spotify.com/v1/me/albums?ids=${albumId}`, fetchOptions, httpStatus.OK, callback, false);
			}
		});
	}

}

module.exports = Spotify;