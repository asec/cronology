var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	log = require("./log.js"),
	profiler = require("../utils/profiler.js"),
	https = require("https"),
	http = require("http");
const EventEmitter = require("events");

class TransactionStep extends EventEmitter
{

	/**
	 * Events: error, complete
	 */

	constructor(dbRecord)
	{
		super();
		for (var i in dbRecord)
		{
			this[i] = dbRecord[i];
		}
	}

	start()
	{
		profiler.start();
		var q = "UPDATE ?? SET `isRunning` = 1, `started` = ? WHERE `id` = ?";
		db.connection.query(q, [config.dbt.STEPS, new Date(), this.id], (err, results, fields) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			this.isRunning = true;
			this.started = new Date();

			log.log({
				trid: this.trid,
				stid: this.id,
				action: "step starting",
				duration: profiler.mark()
			});

			this.registerRequest();
		});
	}

	registerRequest()
	{
		var url = this.url.split("//");
		var connector;
		if (url[0] === "https:")
		{
			connector = https;
		}
		else
		{
			connector = http;
		}
		var request = {};
		var response = {
			status: 0,
			headers: {},
			body: ""
		};
		url = new URL(this.url);
		url.method = "GET";
		var req = connector.request(url, (res) => {
			response.status = res.statusCode;
			response.headers = res.headers;
			res.on("data", (data) => {
				response.body += data;
			});
			res.on("end", () => {
				this.handleRequestFinished(request, response);
			});
		});
		req.on("socket", (socket) => {
			socket.setTimeout(config.api.executionTimeout);
			socket.on("timeout", () => {
				req.abort();
			});
		});
		req.on("error", (err) => {
			this.handleRequestError(request, err);
		});
		req.end();
		request = req.output;
	}

	handleRequestFinished(request, response)
	{
		log.log({
			trid: this.trid,
			stid: this.id,
			action: "step response arrived",
			request: request,
			response: {
				headers: response.headers,
				body: response.body
			},
			status: response.status,
			duration: profiler.mark()
		}, (error, results, fields) => {
			if (error)
			{
				this.emit("error", error);
				return;
			}

			this.handleResponse(response);
		});
	}

	handleRequestError(request, err)
	{
		log.log({
			trid: this.trid,
			stid: this.id,
			action: "step error",
			data: {
				message: err.code + ":" + err.message
			},
			request: request,
			duration: profiler.mark()
		}, (error, results, fields) => {
			this.result = "error";
			var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.STEPS, profiler.get(true), this.result, this.id]);
			if (error)
			{
				this.emit("error", error);
				return;
			}

			this.emit("error", err);
		});
	}

	handleResponse(response)
	{
		if (response.status !== 200)
		{
			this.result = "error";
			var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.STEPS, profiler.get(true), this.result, this.id], (error, results, fields) => {
				if (error)
				{
					this.emit("error", error);
					return;
				}

				this.emit("complete", response);
			});

		}
		else
		{
			this.result = "success";
			var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.STEPS, profiler.get(true), this.result, this.id], (error, results, fields) => {
				if (error)
				{
					this.emit("error", error);
					return;
				}

				this.emit("complete", response);
			});
		}
	}

}

module.exports = TransactionStep;
