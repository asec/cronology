var express = require("express"),
	bodyParser = require("body-parser"),
	mysql = require("mysql"),
	config = require("../config/config.js"),
	apiRoutes = require("./routes/routes.js");

module.exports = {

	app: express(),
	db: null,

	dbConnect: function()
	{
		var self = this;
		console.error("Connecting");
		self.db = mysql.createConnection(config.mysql);
		self.db.connect((err) => {
			if (err)
			{
				console.error("Error while connecting:", err.code);
				setTimeout(() => {
					self.dbConnect();
				}, 100);
			}
			else
			{
				console.error("Connected");
			}
		});
		self.db.on("error", (err) => {
			if (err.fatal)
			{
				setTimeout(() => {
					self.dbConnect();
				}, 100);
			}
		});
	},

	init: function()
	{
		var self = this;
		var app = self.app;
		// Server settings:
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));

		self.dbConnect();

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
			apiRoutes.putTransaction(req, res, next, self.db, config);
		});

		// API: Get a list of transactions
		app.get("/transaction", (req, res, next) => {
			apiRoutes.getTransaction(req, res, next, self.db, config);
		});

		// API: Get a transaction
		app.get("/transaction/:id", (req, res, next) => {
			apiRoutes.getTransactionId(req, res, next, self.db, config);
		});
	}

};
