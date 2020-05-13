const { schemaUrl } = process.env;
if (!schemaUrl) { console.error('Schema Url not set'); }
const redisClient = require('redis').createClient(schemaUrl);
redisClient.on('error', err => console.error(err));

// Keys ought to be function of username to prevent unauth access

function userKey(username) {
	return `user:${username}`;
}

function spotifyCredKey(username) {
	return `sck:${username}`;
}

function spotifyAccessTokenKey(username) {
	return `satk:${username}`
}

function amazonCollectionKey(username) {
	return `ack:${username}`;
}

function amazonPlaylistKey(username, playlistID) {
	return `apk:${username}:${playlistID}`;
}


function amazonAlbumKey(username, albumID) {
	// Todo: should album be protected per user?
	return `aak:${username}:${albumID}`;
}

module.exports = {
	redisClient,
	userKey,
	spotifyCredKey,
	spotifyAccessTokenKey,
	amazonCollectionKey,
	amazonPlaylistKey,
	amazonAlbumKey,
};