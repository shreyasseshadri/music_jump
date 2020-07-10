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
				customFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, fetchOptions, httpStatus.OK, (err,playlist) => {
					if (err) {
						res.sendStatus(err.status);
						console.log(`Error while creating playlist : ${err.message}`);
						return;
					}
					else {
						const response = {
							id: playlist.id,
							type: 'playlist',
							title: playlist.name,
							thumbnails: playlist.images,
							description: playlist.description,
							external_url: playlist.external_urls.spotify,
							tracks: playlist.tracks.items.map(item => ({
								id: item.track.id,
								type: 'track',
								title: item.track.name,
								duration: item.track.duration_ms,
								album: { id: item.track.album.id, title: item.track.album.name },
								thumbnails: item.track.album.images,
								artists: item.track.album.artists.map(artist => ({
									name: artist.name,
									external_url: artist.external_urls.spotify
								})),
								external_url: item.track.external_urls.spotify,
								preview_url: item.track.preview_url
							}))

						}
						callback(null,response);
					}
				});
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
							message: `Error while fetching albums: ${JSON.stringify(err)}`
						}, null);
					}
					else {
						this.getAllPlaylists(access_token, (err, playlists) => {
							if (err) {
								callback({
									status: httpStatus.INTERNAL_SERVER_ERROR,
									message: `Error while fetching playlists: ${JSON.stringify(err)}`
								}, null);
							}
							else {
								const response = {
									id: "spotify-collection",
									title: "Spotify",
									type: "collection",
									albums: albums.items.map((item) => ({
										id: item.album.id,
										type: 'album',
										title: item.album.name,
										thumbnails: item.album.images,
										external_url: item.album.external_urls.spotify
									})),
									playlists: playlists.items.map((playlist) => ({
										id: playlist.id,
										type: 'playlist',
										title: playlist.name,
										thumbnails: playlist.images,
										description: playlist.description,
										external_url: playlist.external_urls.spotify
									}))
								};
								callback(null, response);
							};
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
				customFetch(`https://api.spotify.com/v1/albums/${albumId}`, fetchOptions, httpStatus.OK, (err, album) => {
					if (err) {
						res.sendStatus(err.status);
						console.log(`Error while fetching album: ${err.message}`);
						return;
					}
					else {
						const response = {
							id: album.id,
							type: 'album',
							title: album.name,
							thumbnails: album.images,
							external_url: album.external_urls.spotify,
							tracks: album.tracks.items.map(item => ({
								id: item.id,
								type: 'track',
								title: item.name,
								duration: item.duration_ms,
								album: { id: album.id, title: album.name },
								thumbnails: album.images,
								artists: item.artists.map(artist => ({
									name: artist.name,
									external_url: artist.external_urls.spotify
								})),
								external_url: item.external_urls.spotify,
								preview_url: item.preview_url
							}))
						}
						callback(null,response);
					}
				});
			}
		});
	}

	nameToId(name, type, callback) {

		const promise = new Promise((resolve, reject) => {
			const searchType = (type === 'playlist') ? 'track' : type;
			const body = (type === 'playlist') ? 'tracks' : 'albums';
			const searchQuery = urlEncodedBody({
				q: name,
				type: searchType,
				limit: 1
			})

			this.search(searchQuery, (err, resp) => {
				if (err) {
					reject({
						status: httpStatus.INTERNAL_SERVER_ERROR,
						message: `Error while searching ${searchType} ID: ${JSON.stringify(err)}`
					});
				}
				else if (resp[body].items.length < 1) {
					reject({
						status: httpStatus.BAD_REQUEST,
						message: `Search returned no results: ${err}`
					});
				}
				else {
					const resultItem = resp[body].items[0];
					if (!resultItem.id) {
						reject({
							status: httpStatus.INTERNAL_SERVER_ERROR,
							message: `${searchType} ID not found`
						})
					}
					else {
						resolve(resultItem.id);
					}
				}
			});

		});

		if (callback && typeof callback == 'function') {
			promise
				.then((resp) => callback(null, resp))
				.catch((err) => callback(err, null));
		}

		return promise;
	}

	migrate(migrateData, migrateType, callback) {
		switch (migrateType) {
			case "album": {
				this.migrateAlbum(migrateData, migrateType, callback);
				break
			}
			case "playlist": {
				this.migratePlaylist(migrateData, migrateType, callback);
				break
			}
		}
	}

	promisifiedAddPlaylist(playlistId, songs) {
		return new Promise((resolve, reject) => {
			this.addToPlaylist(playlistId, songs, (err, resp) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(resp);
				}
			})
		});
	}

	addToPlaylist(playlistId, songs, callback) {
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
						"uris": songs.map((song) => `spotify:track:${song.id}`)
					}),
					"method": "POST"
				}
				customFetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, fetchOptions, httpStatus.CREATED, callback);
			}
		});
	}

	migratePlaylist({ playlistName, songs }, type, callback) {
		const searchPromises = [];

		songs.forEach((song) => {
			searchPromises.push(
				this.nameToId(song.name, type)
					.then((id) => song.id = id)
					.catch(err => callback(err, null))
			);
		});


		Promise.all(searchPromises)
			.then(() => {
				this.makePlaylist({ playlistName, playlistDesc: ' ' }, (err, resp) => {
					const playlistId = resp.id;
					if (err) {
						callback({
							status: httpStatus.INTERNAL_SERVER_ERROR,
							message: err
						}, null);
					}
					else {
						const addPromises = [];

						const songsSplice100 = [];
						while (songs.length) {
							songsSplice100.push(songs.splice(0, 100));
						}

						songsSplice100.forEach((songs) => {
							addPromises.push(this.promisifiedAddPlaylist(playlistId, songs));
						})

						Promise.all(addPromises)
							.then(() => {
								callback(null, { success: true, playlistUrl: `https://open.spotify.com/playlist/${playlistId}` })
							})
							.catch((err) => {
								callback({
									status: httpStatus.INTERNAL_SERVER_ERROR,
									message: `Error while adding songs to playlist ${JSON.stringify(err)}`
								}, null);
							})
					}
				});

			})
			.catch(err => callback(err, null))
	}

	migrateAlbum({ albumName }, type, callback) {

		this.nameToId(albumName, type, (err, albumId) => {

			this.addAlbum(albumId, (err, resp) => {
				if (err) {
					callback({
						status: httpStatus.INTERNAL_SERVER_ERROR,
						message: err
					}, null);
				}
				else {
					callback(null, { success: true, albumUrl: `https://open.spotify.com/album/${albumId}` });
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