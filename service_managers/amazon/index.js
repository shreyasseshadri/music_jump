const { redisClient, amazonPlaylistKey, amazonCollectionKey } = require('../../redis');

class Amazon {
	constructor(req) {
		this.username = req.user.username;
	}

	getUser(done) {
		done(null, { username: this.username });
	}

	importDump(data, done) {
		// Note: Importing all fields. Validation required.
		let { playlists, albums } = data;
		let redisInstructions = playlists.reduce((r, p) => {
			r.push(amazonPlaylistKey(this.username, p.id));
			r.push(JSON.stringify(p));
			return r;
		}, []);

		playlists.forEach(p => delete p.tracks);
		albums.forEach(p => delete p.tracks);
		redisInstructions.push(amazonCollectionKey(this.username));
		redisInstructions.push(JSON.stringify({ playlists, albums }));

		redisClient.mset(redisInstructions, done);
	}

	getCollection(done) {
		redisClient.get(
			amazonCollectionKey(this.username),
			(err, data) => done(err, err ? null : JSON.parse(data))
		)
	}

	getPlaylist(id, done) {
		redisClient.get(
			amazonPlaylistKey(this.username, id),
			(err, data) => done(err, err ? null : JSON.parse(data))
		)
	}
}

module.exports = Amazon;