const serviceClasses = {
	amazon: require("./amazon"),
	spotify: require("./spotify")
}

module.exports = {
	serviceClasses,
	supportedServices: Object.keys(serviceClasses)
}