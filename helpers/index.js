const httpStatus = require('http-status-codes');
const fetch = require('node-fetch');

function urlEncodedBody(body) {
	return Object.keys(body)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
		.join('&');
}

function customFetch(url,fetchOptions,expectedStatus,callback) {
	fetch(url,fetchOptions)
	.then(async (resp) => {
		const json = await resp.json();
		(resp.status === expectedStatus) ? callback(null,json) : callback(json.error,null);
	})
	.catch(err => callback({status:httpStatus.INTERNAL_SERVER_ERROR,message:err},null));
}

module.exports = {
	urlEncodedBody,
	customFetch
}