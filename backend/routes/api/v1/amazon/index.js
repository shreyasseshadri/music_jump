var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');

// Access entire music collection
router.use('/collection', require('./collection'));

// Access a playlist
// TODO: validate 'name'
router.use('/playlist/:name', require('./playlist'));

module.exports = router;
