const httpStatus = require('http-status-codes');

const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:5000',
];

function cors(req, res, next) {
	const origin = req.headers.origin;
	if (allowedOrigins.indexOf(origin) >= 0) {
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Origin', origin);
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, credentials');
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


module.exports = cors ;