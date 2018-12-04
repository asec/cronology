var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	scheduleResolver = require("../utils/scheduleResolver.js");

class Transaction
{

	constructor(trid, schedule)
	{
		this.trid = trid;
		this.date = scheduleResolver.resolve(schedule);
		this.isRunning = false;
		this.isFinished = false;
		this.data = {};
	}

	start()
	{
		this.isRunning = true;
		this.isFinished = false;
		this.load();
		console.log(this.trid, "has just started");
	}

	finish()
	{
		this.isRunning = false;
		this.isFinished = true;
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
					console.error("Loading transaction: MySQL query transaction error: " + (err.sqlMessage || err.message));
					this.finish();
				}

				if (results.length !== 1)
				{
					console.error("Loading transaction: The following transaction could not be found: " + this.trid);
					this.finish();
				}

				Object.keys(results[0]).map((key, i) => {
					var item = results[0][key];
					this.data[key] = item;
				});
				this.data.steps = [];

				q = "SELECT * FROM ?? WHERE `trid` = ? ORDER BY `id` ASC";
				db.connection.query(q, [config.dbt.STEPS, this.trid], (err, results, fields) => {
					if (err)
					{
						console.error("Loading transaction steps: MySQL query steps error: " + (err.sqlMessage || err.message));
						this.finish();
					}

					this.data.steps = results.map((item, i) => {
						var newItem = {};
						Object.keys(item).map((key, ii) => {
							newItem[key] = item[key];
						});

						return newItem;
					});

					// TODO: Ha a betöltés kész, akkor a stepeket elkezdhetjük feldolgozni
					this.finish();

				});

			});
		}
	}
}

module.exports = Transaction;
