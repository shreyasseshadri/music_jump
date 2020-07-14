var express = require('express');
var router = express.Router();
const httpStatus = require('http-status-codes');

// Access raw service data
router.use('/dump', require('./dump'));

// Access entire music collection
router.use('/access/collection', require('./collection'));

// Access a playlist
// TODO: validate 'id'
router.use('/access/playlist/:id', require('./playlist'));
router.use('/access/album/:id', require('./album'));

module.exports = router;
