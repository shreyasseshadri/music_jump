var express = require('express');
var router = express.Router();

router.use('/spotify', require('./spotify'));

module.exports = router;