var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');
const { redisClient, spotifyCredKey } = require('../../../../redis');

router.use('/auth', require('./auth'));
router.use(function (req, res, next) {
	redisClient.exists(spotifyCredKey(req.user.username), (err, reply) => {
		if(reply === 1){
			next();
		}
		else {
			res.status(httpStatus.UNAUTHORIZED).send('Spotify auth not done');
		} 
	})
});
router.use('/access', require('./access'));
module.exports = router;
