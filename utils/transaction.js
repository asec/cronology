var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	scheduleResolver = require("../utils/scheduleResolver.js"),
	log = require("./log.js"),
	profiler = require("../utils/profiler.js"),
	TransactionStep = require("./transactionStep.js"),
	https = require("https"),
	http = require("http");
const EventEmitter = require("events");

class Transaction extends EventEmitter
{

	/**
	 * Events:
	 * starting, loaded, started, step.starting, step.finished, schedule.complete
	 * error, finish, complete
	 */

	constructor(trid, schedule)
	{
		super();
		this.trid = trid;
		this.date = scheduleResolver.resolve(schedule);
		this.isRunning = false;
		this.isFinished = false;
		this.data = {};
		this.steps = [];
		this.totalTime = 0;

		this.on("error", this.handleError);
		//this.on("starting", this.load);
		//this.on("loaded", this.setRunningFlag);
		//this.on("started", this.doProgress);
		this.on("finish", this.finish);
	}

	handleError(phase, message)
	{
		if (phase === "load" || phase === "step")
		{
			log.log({
				trid: this.trid,
				action: "transaction error",
				data: {
					message: message
				},
				duration: profiler.mark()
			});
			this.emit("finish");
		}
	}

	start()
	{
		this.isRunning = true;
		this.isFinished = false;
		log.log({
			trid: this.trid,
			action: "transaction starting"
		}, (err, results, fields) => {
			if (err)
			{
				this.emit("error", "start", "Log before load: MySQL log error: " + (err.sqlMessage || err.message));
				return;
			}

			this.emit("starting");
			this.load();
		});
	}

	finish()
	{
		this.isRunning = false;
		this.isFinished = true;

		log.log({
			trid: this.id,
			action: "transaction finished",
			duration: this.totalTime
		}, (err, results, fields) => {
			if (err)
			{
				this.emit("error", "finish", "Log on finish: MySQL log error: " + (err.sqlMessage || err.message));
				return;
			}

			var q = "UPDATE ?? SET `isRunning` = 0, `isFinished` = ?, `completedSteps` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, this.data.isRecurring ? 0 : 1, this.data.completedSteps, this.trid], (err, results, fields) => {
				if (err)
				{
					this.emit("error", "finish", "Log on finish: MySQL transaction error: " + (err.sqlMessage || err.message));
					return;
				}

				this.emit("complete");
			});
		});
	}

	load()
	{
		if (!this.data.trid)
		{
			var q = "SELECT * FROM ?? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, this.trid], (err, results, fields) => {
				if (err)
				{
					this.emit("error", "load", "Loading transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
					return;
				}

				if (results.length !== 1)
				{
					this.emit("error", "load", "Loading transaction: The following transaction could not be found: " + this.trid);
					return;
				}

				Object.keys(results[0]).map((key, i) => {
					var item = results[0][key];
					this.data[key] = item;
				});
				this.loadSteps();
			});
		}
		else
		{
			this.loadSteps();
		}
	}

	loadSteps()
	{
		if (!this.steps || !this.steps.length)
		{
			this.steps = [];

			var q = "SELECT * FROM ?? WHERE `trid` = ? ORDER BY `id` ASC";
			db.connection.query(q, [config.dbt.STEPS, this.trid], (err, results, fields) => {
				if (err)
				{
					this.emit("error", "load", "Loading transaction steps: MySQL query steps error: " + (err.sqlMessage || err.message));
					return;
				}

				this.steps = results.map((item, i) => {
					var newItem = {};
					Object.keys(item).map((key, ii) => {
						newItem[key] = item[key];
					});

					return new TransactionStep(newItem);
				});

				if (!this.steps.length)
				{
					if (this.data.stepsGetterUrl)
					{
						this.loadStepsFromUrl();
					}
					else
					{
						this.emit("error", "load-steps");
					}
				}
				else
				{
					this.emit("loaded");
					this.setRunningFlag();
				}
			});
		}
		else
		{
			this.emit("loaded");
			this.setRunningFlag();
		}
	}

	loadStepsFromUrl()
	{
		log.log({
			trid: this.trid,
			action: "transaction getting steps",
			data: {
				url: this.data.stepsGetterUrl
			}
		}, (error, results, fields) => {
			if (error)
			{
				this.emit("error", "log", "Log on loadStepsFromUrl: " + (error.sqlMessage || error.message));
				return;
			}

			profiler.start();
			var url = this.data.stepsGetterUrl.split("//");
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

			try
			{
				url = new URL(this.data.stepsGetterUrl);
				url.method = "GET";
				var req = connector.request(url, (res) => {
					response.status = res.statusCode;
					response.headers = res.headers;
					res.on("data", (data) => {
						response.body += data;
					});
					res.on("end", () => {
						try
						{
							var data = JSON.parse(response.body);
							this.handleStepsRequestFinished(request, response, data);
						}
						catch (e)
						{
							this.handleStepsRequestError(request, e);
						}
					});
				});
				req.on("socket", (socket) => {
					socket.setTimeout(config.api.executionTimeout);
					socket.on("timeout", () => {
						req.abort();
					});
				});
				req.on("error", (err) => {
					this.handleStepsRequestError(request, err);
				});
				req.end();
				request = req.output;
			}
			catch (e)
			{
				this.emit("error", "load", e.message);
			}
		});
	}

	handleStepsRequestFinished(request, response, data)
	{
		log.log({
			trid: this.trid,
			stid: this.id,
			action: "transaction getting steps response",
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
				this.emit("error", "log", error);
				return;
			}

			if (!data || !(data instanceof Array) || !data.length)
			{
				this.emit("error", "load", "Could not get any valid steps from stepsGetterUrl.");
				return;
			}

			var steps = data.map((value, key) => {
				return value.url;
			});
			steps = steps.filter((value, key) => {
				return !!value;
			});
			if (!steps.length)
			{
				this.emit("error", "load", "Could not get any valid steps from stepsGetterUrl.");
				return;
			}

			var q = "UPDATE ?? SET `numSteps` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, steps.length, this.trid], (err, results, fields) => {
				if (err)
				{
					this.emit("error", "log", "MySQL query update transaction error: " + (err.sqlMessage || err.message));
					return;
				}

				var values = steps.map((value, key) => {
					return [
						this.trid,
						value,
						new Date()
					];
				});
				q = "INSERT INTO ?? (`trid`, `url`, `created`) VALUES ?";
				db.connection.query(q, [config.dbt.STEPS, values], (err, results, fields) => {
					if (err)
					{
						q = "DELETE FROM ?? WHERE `trid` = ?";
						db.query(q, [config.dbt.STEPS, message.trid]);
						this.emit("error", "log", "MySQL query creating steps for transaction error: " + (err.sqlMessage || err.message));
					}

					this.loadSteps();
				});
			});
		});
	}

	handleStepsRequestError(request, err)
	{
		log.log({
			trid: this.trid,
			action: "transaction getting steps error",
			data: {
				message: (err.code ? err.code + ":" : "") + err.message
			},
			request: request,
			duration: profiler.mark()
		}, (error, results, fields) => {
			if (error)
			{
				this.emit("error", "log", "Log handleStepsRequestError: " + (error.sqlMessage || error.message));
				return;
			}

			this.emit("error", "getting-steps", err);
		});
	}

	setRunningFlag()
	{
		var q = "UPDATE ?? SET `isRunning` = 1 WHERE `id` = ?";
		db.connection.query(q, [config.dbt.TRANSACTIONS, this.trid], (err, results, fields) => {
			if (err)
			{
				this.emit("error", "load", "Starting transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
				return;
			}

			this.emit("started");
			this.doProgress();
		});
	}

	doProgress()
	{
		for (var i = 0; i < this.steps.length; i++)
		{
			var step = this.steps[i];
			if (step.result === "none")
			{
				this.emit("step.starting", i);

				step.on("error", (err) => {
					this.emit("error", "step", "During step " + (Math.floor(i + 1) + "/" + this.steps.length) + ": MySQL query step error: " + (err.sqlMessage || err.message));
					this.emit("step.finished", i, err, null);
				});
				step.on("complete", (result) => {
					this.emit("step.finished", i, null, result);
					this.totalTime += profiler.get(true);
					if (result.status !== 200)
					{
						this.emit("finish");
						return;
					}
					else
					{
						var isThereMore = (i <= this.steps.length - 1);
						var isLastStep = (i === this.steps.length - 1);
						if (isThereMore)
						{
							this.data.completedSteps++;
							if (this.data.waitAfterStep > 0 && !isLastStep)
							{
								setTimeout(() => {
									this.doProgress();
								}, this.data.waitAfterStep * 1000);
							}
							else
							{
								this.doProgress();
							}
						}
						else
						{
							//this.finish();
							this.emit("finish");
						}
						return;
					}
				});
				step.start();
				break;
			}
		}
		if (i > this.steps.length - 1)
		{
			//this.finish();
			this.emit("finish");
		}
	}

	scheduleAgain()
	{
		if (!this.data || !this.data.id || !this.data.isRecurring)
		{
			return false;
		}
		var q = "UPDATE ?? SET `isFinished` = ? WHERE `id` = ?";
		db.connection.query(q, [config.dbt.TRANSACTIONS, 1, this.trid], (err, results, fields) => {
			if (err)
			{
				this.emit("error", "schedule-again", "Closing previous transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
				return;
			}

			log.log({
				trid: this.trid,
				action: "transaction schedule-again"
			}, (error, results, fields) => {
				if (error)
				{
					this.emit("error", "schedule-again", "Log on shceduleAgain: " + (error.sqlMessage || error.message));
					return;
				}

				if (!this.data.originator)
				{
					this.data.originator = this.trid;
				}
				this.data.id = null;
				this.data.isRunning = 0;
				this.data.isFinished = 0;
				this.data.isCanceled = 0;
				this.data.completedSteps = 0;
				this.data.created = new Date();
				var q = "INSERT INTO `" + config.dbt.TRANSACTIONS + "` SET ?";
				db.connection.query(q, this.data, (err, results, fields) => {
					if (err)
					{
						this.emit("error", "schedule-again", "Copying transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
						return;
					}

					this.data.id = results.insertId;
					if (this.data.stepsGetterUrl)
					{
						this.emit("schedule.complete", this.data.id, this.data.schedule);
					}
					else
					{
						this.scheduleStep(0);
					}
				});
			});
		});
	}

	scheduleStep(index)
	{
		if (!this.steps[index])
		{
			log.log({
				trid: this.trid,
				action: "transaction schedule-again complete"
			}, (error, results, fields) => {
				if (error)
				{
					this.emit("error", "schedule-again", "Log on scheduleStep ended: " + (error.sqlMessage || error.message));
					return;
				}

				this.emit("schedule.complete", this.data.id, this.data.schedule);
			});
			return;
		}

		var step = this.steps[index];
		var newStep = {
			id: null,
			trid: this.data.id,
			url: step.url,
			isRunning: 0,
			created: new Date(),
			started: null,
			duration: 0,
			result: "none"
		};
		log.log({
			trid: this.trid,
			stid: step.id,
			action: "step schedule-again",
			data: newStep
		}, (error, results, fields) => {
			if (error)
			{
				this.emit("error", "schedule-again", "Log on schedule step: " + (error.sqlMessage || error.message));
				return;
			}

			var q = "INSERT INTO `" + config.dbt.STEPS + "` SET ?";
			db.connection.query(q, newStep, (err, results, fields) => {
				if (err)
				{
					this.emit("error", "schedule-again", "Copying step (" + index + "): MySQL query transaction error: " + (err.sqlMessage || err.message));
					return;
				}

				this.scheduleStep(index + 1);
			});
		});
	}
}

module.exports = Transaction;
