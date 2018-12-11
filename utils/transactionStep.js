var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	log = require("./log.js"),
	profiler = require("../utils/profiler.js"),
	https = require("https"),
	http = require("http");

class TransactionStep
{

	constructor(item)
	{
		for (var i in item)
		{
			this[i] = item[i];
		}
	}

	start(callback)
	{
		profiler.start();
		var q = "UPDATE ?? SET `isRunning` = 1, `started` = ? WHERE `id` = ?";
		db.connection.query(q, [config.dbt.STEPS, new Date(), this.id], (err, results, fields) => {
			if (err && callback instanceof Function)
			{
				return callback(err, null);
			}

			log.log({
				trid: this.trid,
				stid: this.id,
				action: "starting step",
				duration: profiler.mark()
			});

			this.isRunning = true;
			this.started = new Date();
			var url = this.url.split("//");
			var connector = null;
			if (url[0] === "http:")
			{
				connector = http;
			}
			else if (url[0] === "https:")
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
				headers: {}
			};
			url = new URL(this.url);
			url.method = "GET";
			var req = connector.request(url, (res) => {
				response.status = res.statusCode;
				response.headers = res.headers;
				var body = "";
				res.on("data", (data) => {
					body += data;
				});
				res.on("end", () => {
					log.log({
						trid: this.trid,
						stid: this.id,
						action: "response arrived",
						request: request,
						response: {
							headers: response.headers,
							body: body
						},
						status: response.status,
						duration: profiler.mark()
					}, (error, results, fields) => {
						if (error)
						{
							if (callback instanceof Function)
							{
								callback(error, null);
							}
							return;
						}

						if (response.status !== 200)
						{
							this.result = "error";
							var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
							db.connection.query(q, [config.dbt.STEPS, profiler.get(true), "error", this.id], (error, results, fields) => {
								if (error)
								{
									if (callback instanceof Function)
									{
										callback(error, null);
									}
									return;
								}

								if (callback instanceof Function)
								{
									callback(null, response);
								}
							});

						}
						else
						{
							this.result = "success";
							var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
							db.connection.query(q, [config.dbt.STEPS, profiler.get(true), "success", this.id], (error, results, fields) => {
								if (error)
								{
									if (callback instanceof Function)
									{
										callback(error, null);
									}
									return;
								}

								if (callback instanceof Function)
								{
									return callback(null, response);
								}
							});
						}
					});
				});
			});
			req.on("socket", (socket) => {
				socket.setTimeout(600000); // 10 mins
				socket.on("timeout", () => {
					req.abort();
				});
			});
			req.on("error", (err) => {
				log.log({
					trid: this.trid,
					stid: this.id,
					action: "error on step",
					data: {
						message: err.code + ":" + err.message
					},
					request: request,
					duration: profiler.mark()
				}, (error, results, fields) => {
					this.result = "error";
					var q = "UPDATE ?? SET `duration` = ?, `result` = ? WHERE `id` = ?";
					db.connection.query(q, [config.dbt.STEPS, 1, "error", this.id]);
					if (error && callback instanceof Function)
					{
						return callback(error, null);
					}

					if (callback instanceof Function)
					{
						return callback(err, null);
					}
				});
			});
			req.end();
			request = req.output;
		});
		console.log("Starting step: ", this.id);
	}

}

module.exports = TransactionStep;
