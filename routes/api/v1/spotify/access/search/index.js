var express = require('express');
const httpStatus = require('http-status-codes');
var router = express.Router();
const { fetchDetails } = require("../userDetails")
const { customFetch,urlEncodedBody } = require("../../../../../../helpers")

function search(query, access_token, callback) {
	var fetchOptions = {
		"headers": {
			"authorization": `Bearer ${access_token}`
		}
	}
	customFetch(`https://api.spotify.com/v1/search?${query}`,fetchOptions,httpStatus.OK, callback);
}

router.get('/', function (req, res) {

	fetchDetails(req.user.username, (err, { user, access_token }) => {
		if (err) {
			res.sendStatus(err.status);
			console.log(err.message);
			return;
		}
		search(urlEncodedBody(req.query),access_token,(err,resp) => {
			if(resp){
				res.json(resp);
			}
			else {
				res.sendStatus(err.status);
				console.log(`Error while searching : ${err.message}`);
			}
		})

	});

});

module.exports = router;