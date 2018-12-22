var express = require("express"),
	bodyParser = require("body-parser"),
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

		app.listen(config.api.port, () => {
			console.log("Server started on " + config.api.port);
		});

		// TODO: Link or redirect to the github page
		app.get("/", (req, res, next) => {
			res.json({
				test: "Valami",
				success: true
			})
		});

		// API: Create a transaction
		app.put("/transaction", (req, res, next) => {
			const route = new apiRoutes.put.transaction();
			route.on("error", (err) => {
				res.json({
					success: false,
					error: err.message
				});
			});
			route.on("complete", (message) => {
				res.json(message);
			});
			route.on("success", (trid, schedule) => {
				scheduler.add(trid, schedule);
			});
			route.process(req);
		});

		// API: Get a list of transactions
		app.get("/transaction", (req, res, next) => {
			const route = new apiRoutes.get.transaction();
			route.on("error", (err) => {
				res.json({
					success: false,
					error: err.message
				});
			});
			route.on("complete", (message) => {
				res.json(message);
			});
			route.process(req);
		});

		// API: Get a transaction
		app.get("/transaction/:id", (req, res, next) => {
			const route = new apiRoutes.get.transactionId();
			route.on("error", (err) => {
				res.json({
					success: false,
					error: err.message
				});
			});
			route.on("complete", (message) => {
				res.json(message);
			});
			route.process(req);
		});
	}

};
