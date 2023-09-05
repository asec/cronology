const express = require("express"),
	httpWrapper = require('https'),
	fs = require('fs'),
	cors = require("cors"),
	bodyParser = require("body-parser"),
	apiRoutes = require("./routes/routes.js");

module.exports = {

	app: express(),
	scheduler: null,

	createServer: function()
	{
		const app = this.app;
		const credentials = {
			key: fs.readFileSync(process.env.CONF_API_HTTPS_PRIVATEKEY, 'utf8'),
			cert: fs.readFileSync(process.env.CONF_API_HTTPS_CERTIFICATE, 'utf8')
		};
		const http = httpWrapper.createServer(credentials, app);
		// Server settings:
		app.use(cors());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));

		return http;
	},

	init: function(scheduler)
	{
		const http = this.createServer();
		const app = this.app;

		http.listen(process.env.CONF_API_PORT, () => {
			console.log("Server started on " + process.env.CONF_API_PORT);
		});

		// TODO: Link or redirect to the github page
		app.get("/", (req, res, next) => {
			res.json({
				test: "Valami",
				success: true
			})
		});

		// API: Get settings (important for the first run of the gui)
		app.get("/settings", (req, res, next) => {
			const route = new apiRoutes.get.settings();
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

		// API: Create an admin user
		app.put("/admin", (req, res, next) => {
			const route = new apiRoutes.put.admin();
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

		// API: Logs in a user
		app.post("/login", (req, res, next) => {
			const route = new apiRoutes.post.login();
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

		// API: Get all previous runs for a transaction
		app.get("/transaction/:id/list", (req, res, next) => {
			const route = new apiRoutes.get.transactionIdList();
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

		// API: Cancel a transaction
		app.post("/transaction/:id/cancel", (req, res, next) => {
			const route = new apiRoutes.post.transactionIdCancel();
			route.on("error", (err) => {
				res.json({
					success: false,
					error: err.message
				});
			});
			route.on("complete", (message) => {
				res.json(message);
			});
			route.process(req, scheduler);
		});

		// API: Get a list of users
		app.get("/user", (req, res, next) => {
			const route = new apiRoutes.get.users();
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

		// API: Get the data of a single user by id
		app.get("/user/:id", (req, res, next) => {
			const route = new apiRoutes.get.userId();
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

		// API: Register a new normal user
		app.put("/user", (req, res, next) => {
			const route = new apiRoutes.put.users();
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

		// API: Edit a user
		app.put("/user/:id", (req, res, next) => {
			const route = new apiRoutes.put.usersId();
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

		// API: Delete a user
		app.delete("/user/:id/delete", (req, res, next) => {
			const route = new apiRoutes.delete.users();
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

		// API: Create a project
		app.put("/project", (req, res, next) => {
			const route = new apiRoutes.put.project();
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

		// API: Get a list of projects
		app.get("/project", (req, res, next) => {
			const route = new apiRoutes.get.project();
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

		// API: Get the data of a single project by id
		app.get("/project/:id", (req, res, next) => {
			const route = new apiRoutes.get.projectId();
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

		// API: Edit a project
		app.put("/project/:id", (req, res, next) => {
			const route = new apiRoutes.put.projectId();
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

		// API: Delete a project
		app.delete("/project/:id/delete", (req, res, next) => {
			const route = new apiRoutes.delete.project();
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
