const { schemaUrl } = process.env;
if (!schemaUrl) { console.error('Schema Url not set'); }
const redisClient = require('redis').createClient(schemaUrl);
redisClient.on('error', err => console.error(err));

function userKey(username) {
	return `user:${username}`;
}

function spotifyCredKey(username) {
	return `sck:${username}`;
}

function spotifyAccessTokenKey(username) {
	return `satk:${username}`
}

module.exports = {
	redisClient,
	userKey,
	spotifyCredKey,
	spotifyAccessTokenKey,
};