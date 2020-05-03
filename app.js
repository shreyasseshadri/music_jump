var express = require('express');
var path = require('path');
var logger = require('morgan');
var passport = require('passport');
const httpStatus = require('http-status-codes');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// Configure
const { redisClient } = require('./redis');
require('./passport');

// Routers
var apiRouter = require('./routes/api');
var defaultRouter = require('./routes/default');

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
	session({
		store: new RedisStore({ client: redisClient }),
		secret: process.env.express_session_secret,
		resave: false,
		saveUninitialized: false,
	})
)
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiRouter);
app.use('/', defaultRouter);
app.use(function (req, res) {
	res.sendStatus(httpStatus.NOT_FOUND);
});

// error handler
app.use(function (err, req, res, next) {
	console.error(err.message);
	res.sendStatus(err.status || 500);
});

module.exports = app;