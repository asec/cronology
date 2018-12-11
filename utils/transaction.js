var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	scheduleResolver = require("../utils/scheduleResolver.js"),
	log = require("./log.js"),
	profiler = require("../utils/profiler.js"),
	TransactionStep = require("./transactionStep.js");

class Transaction
{

	constructor(trid, schedule)
	{
		this.trid = trid;
		this.date = scheduleResolver.resolve(schedule);
		this.isRunning = false;
		this.isFinished = false;
		this.data = {};
		this.steps = [];
		this.totalTime = 0;
	}

	start()
	{
		this.isRunning = true;
		this.isFinished = false;
		log.log({
			trid: this.trid,
			action: "starting transaction"
		}, (err, results, fields) => {
			if (err)
			{
				console.error("Log before load: MySQL log error: " + (err.sqlMessage || err.message));
				return;
			}

			console.log(this.trid, "has just started");
			this.load();
		});
	}

	finish()
	{
		this.isRunning = false;
		this.isFinished = true;

		log.log({
			trid: this.id,
			action: "finished transaction",
			duration: this.totalTime
		}, (err, results, fields) => {
			if (err)
			{
				console.error("Log on finish: MySQL log error: " + (err.sqlMessage || err.message));
				return;
			}

			var q = "UPDATE ?? SET `isRunning` = 0, `isFinished` = 1, `completedSteps` = ? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, this.data.completedSteps, this.trid], (err, results, fields) => {
				if (err)
				{
					console.error("Log on finish: MySQL transaction error: " + (err.sqlMessage || err.message));
					return;
				}
			});
		});
		console.log(this.trid, "has just finished");
	}

	load()
	{
		if (!this.data.trid)
		{
			var q = "SELECT * FROM ?? WHERE `id` = ?";
			db.connection.query(q, [config.dbt.TRANSACTIONS, this.trid], (err, results, fields) => {
				if (err)
				{
					this.handleLoadError("Loading transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
					return;
				}

				if (results.length !== 1)
				{
					this.handleLoadError("Loading transaction: The following transaction could not be found: " + this.trid);
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
						this.handleLoadError("Loading transaction steps: MySQL query steps error: " + (err.sqlMessage || err.message));
						return;
					}

					this.steps = results.map((item, i) => {
						var newItem = {};
						Object.keys(item).map((key, ii) => {
							newItem[key] = item[key];
						});

						return new TransactionStep(newItem);
					});

					this.handleLoadSuccess();

				});

			});
		}
	}

	handleLoadError(msg)
	{
		console.error(msg);
		log.log({
			trid: this.trid,
			action: "transaction error",
			data: {
				message: msg
			},
			duration: profiler.mark()
		});
		this.finish();
	}

	handleLoadSuccess()
	{
		var q = "UPDATE ?? SET `isRunning` = 1 WHERE `id` = ?";
		db.connection.query(q, [config.dbt.TRANSACTIONS, this.trid], (err, results, fields) => {
			if (err)
			{
				this.handleLoadError("Starting transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
				return;
			}

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
				console.log("Starting step " + (Math.floor(i + 1) + "/" + this.steps.length));
				step.start((err, result) => {
					console.log("Finished step " + (Math.floor(i + 1) + "/" + this.steps.length));
					if (err)
					{
						this.handleLoadError("During step " + (Math.floor(i + 1) + "/" + this.steps.length) + ": MySQL query step error: " + (err.sqlMessage || err.message));
						return;
					}

					this.totalTime += profiler.get(true);

					if (result.status !== 200)
					{
						this.finish();
						return;
					}
					else
					{
						if (i <= this.steps.length - 1)
						{
							this.data.completedSteps++;
							if (this.data.waitAfterStep > 0 && i != this.steps.length - 1)
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
							this.finish();
						}
						return;
					}
				});
				break;
			}
		}
		if (i > this.steps.length - 1)
		{
			this.finish();
		}
	}
}

module.exports = Transaction;
