config = window.applicationContextConfiguration;

function getPlaylists(cb) {
	fetch("https://music.amazon.in/EU/api/playlists/", {
		"credentials": "include",
		"headers": {
			"User-Agent": navigator.userAgent,
			"Accept": "*/*",
			"Accept-Language": "en-US,en;q=0.5",
			"content-type": "application/json",
			"Content-Encoding": "amz-1.0",
			"X-Amz-Target": "com.amazon.musicplaylist.model.MusicPlaylistService.getOwnedPlaylistsInLibrary",
			"csrf-token": config.CSRFTokenConfig.csrf_token,
			"csrf-rnd": config.CSRFTokenConfig.csrf_rnd,
			"csrf-ts": config.CSRFTokenConfig.csrf_ts,
			"X-Requested-With": "XMLHttpRequest"
		},
		"referrer": "https://music.amazon.in/home",
		"body": JSON.stringify({
			pageSize: 100, entryOffset: 0,
			deviceId: config.deviceId,
			deviceType: config.deviceType,
			musicTerritory: config.musicTerritory,
			customerId: config.customerId
		}),
		"method": "POST",
		"mode": "cors"
	}).then(res => {
		if (res.ok) {
			return res.json()
		}
		throw new Error(res.statusText);
	}).then(data => cb(null, data)).catch(err => cb(err));
}

function getTracks(playlistIds, cb) {
	fetch("https://music.amazon.in/EU/api/playlists/", {
		"credentials": "include",
		"headers": {
			"User-Agent": navigator.userAgent,
			"Accept": "*/*",
			"Accept-Language": "en-US,en;q=0.5",
			"content-type": "application/json",
			"Content-Encoding": "amz-1.0",
			"X-Amz-Target": "com.amazon.musicplaylist.model.MusicPlaylistService.getPlaylistsByIdV2",
			"csrf-token": config.CSRFTokenConfig.csrf_token,
			"csrf-rnd": config.CSRFTokenConfig.csrf_rnd,
			"csrf-ts": config.CSRFTokenConfig.csrf_ts,
			"X-Requested-With": "XMLHttpRequest"
		},
		"referrer": "https://music.amazon.in/home",
		"body": JSON.stringify({
			playlistIds: playlistIds,
			requestedMetadata: ["asin", "albumName", "albumAsin", "sortAlbumName", "artistName", "artistAsin", "primeStatus", "isMusicSubscription", "duration", "sortArtistName", "sortAlbumArtistName", "objectId", "title", "status", "assetType", "discNum", "trackNum", "instantImport", "purchased", "uploaded", "fileExtension", "fileName", "parentalControls"],
			deviceId: config.deviceId,
			deviceType: config.deviceType,
			musicTerritory: config.musicTerritory,
			customerId: config.customerId
		}),
		"method": "POST",
		"mode": "cors"
	}).then(res => {
		if (res.ok) {
			return res.json()
		}
		throw new Error(res.statusText);
	}).then(data => cb(null, data)).catch(err => cb(err));
}


function getPlaylistData(cb) {
	getPlaylists((err, playlistData) => {
		if (err) {
			return cb(err);
		}
		let playlistIds = playlistData.playlists.map(d => d.playlistId);
		getTracks(playlistIds, (err, data) => {
			if (err) {
				return cb(err);
			}
			let playlistData = data.playlists.map(d => ({
				title: d.metadata.title,
				tracks: d.tracks.map(t => ({
					title: t.metadata.requestedMetadata.title,
					album: t.metadata.requestedMetadata.albumName,
					artist: t.metadata.requestedMetadata.artistName,
				}))
			}));
			cb(null, playlistData);
		});
	})
}

// getPlaylistData((err, data) => console.log(data))

function authSpotify(){
	console.log('here')
	const clientId = '6ee41ec949c1410e88baf26295177434';
	const authUrl = 'https://accounts.spotify.com/authorize';
	const params = {
		response_type: 'code',
		redirect_uri: encodeURIComponent('http://localhost:3000/api/v1/auth/spotify'),
		state: 'random_string_shreyas'
	}
	const scope = "playlist-modify-public playlist-read-private playlist-modify-private"
	const requestUrl = authUrl+'?client_id='+clientId+'&response_type=' + params.response_type
	+'&redirect_uri=' + params.redirect_uri + '&scope=' + encodeURIComponent(scope) + '&state=' + params.state;
	window.location = requestUrl;
	// fetch(requestUrl,{'mode':'cors'}).then((resp) => resp.text()).then(html => document.body.innerHTML = html)
}
authSpotify();