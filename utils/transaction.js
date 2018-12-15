var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	scheduleResolver = require("../utils/scheduleResolver.js"),
	log = require("./log.js"),
	profiler = require("../utils/profiler.js"),
	TransactionStep = require("./transactionStep.js");
const EventEmitter = require("events");

class Transaction extends EventEmitter
{

	/**
	 * Events:
	 * starting, loaded, started, step.starting, step.finished
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
					message: msg
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

			var q = "UPDATE ?? SET `isRunning` = 0, `isFinished` = 1, `completedSteps` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, this.data.completedSteps, this.trid], (err, results, fields) => {
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
				this.steps = [];

				q = "SELECT * FROM ?? WHERE `trid` = ? ORDER BY `id` ASC";
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

					this.emit("loaded");
					this.setRunningFlag();
				});
			});
		}
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
}

module.exports = Transaction;
