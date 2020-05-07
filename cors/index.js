const httpStatus = require('http-status-codes');

const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:5000',
];

const exceptionRoutes = [
	'/v1/spotify/auth/authorize',
	'/v1/spotify/auth/callback',
];

const allowedMethods = [
	'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'
].join(',');

const allowedHeaders = [
	'X-Requested-With', 'X-HTTP-Method-Override',
	'Content-Type', 'Accept', 'credentials', 'cache-control',
].join(',');

function isException(url, exceptionRoutes) {
	for (let i = 0; i < exceptionRoutes.length; ++i) {
		if (url.startsWith(exceptionRoutes[i])) {
			return true;
		}
	}
	return false;
}

function cors(req, res, next) {
	const origin = req.headers.origin;
	if (allowedOrigins.indexOf(origin) >= 0 || isException(req.url, exceptionRoutes)) {
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Origin', origin);
		res.header('Access-Control-Allow-Methods', allowedMethods);
		res.header('Access-Control-Allow-Headers', allowedHeaders);
		if ('OPTIONS' === req.method) {
			res.sendStatus(httpStatus.OK);
		} else {
			next();
		}
	}
	else {
		res.sendStatus(httpStatus.NOT_FOUND);
	}
}


module.exports = cors;