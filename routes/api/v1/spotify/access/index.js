var express = require('express');
var router = express.Router();

router.use('/playlist', require('./playlist'));
router.use('/search',require('./search'));
router.use('/collection',require('./collection'));
module.exports = router;