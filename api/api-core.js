var express = require("express"),
	bodyParser = require("body-parser"),
	db = require("../utils/db.js"),
	config = require("../config/config.js"),
	apiRoutes = require("./routes/routes.js");

module.exports = {

	app: express(),
	scheduler: null,

	init: function(scheduler)
	{
		var self = this;
		var app = self.app;
		// Server settings:
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));

		app.listen(3000, () => {
			console.log("Server started on :3000");
		});

		app.get("/", (req, res, next) => {
			res.json({
				test: "Valami",
				success: true
			})
		});

		// API: Create a transaction
		app.put("/transaction", (req, res, next) => {
			apiRoutes.putTransaction(req, res, next, db.connection, config, scheduler);
		});

		// API: Get a list of transactions
		app.get("/transaction", (req, res, next) => {
			apiRoutes.getTransaction(req, res, next, db.connection, config);
		});

		// API: Get a transaction
		app.get("/transaction/:id", (req, res, next) => {
			apiRoutes.getTransactionId(req, res, next, db.connection, config);
		});
	}

};
