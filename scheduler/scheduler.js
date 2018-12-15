var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	Transaction = require("../utils/transaction.js");

module.exports = {

	queue: [],
	interval: null,

	init: function()
	{
		db.dbConnect();

		var q = "SELECT `id`, `schedule` FROM ?? WHERE `isCanceled` = 0 AND `isFinished` = 0 ORDER BY `created` ASC";
		db.connection.query(q, [config.dbt.TRANSACTIONS], (err, results, fields) => {
			if (err)
			{
				console.error("Scheduler init: transactions error", err);
				return;
			}

			for (var i = 0; i < results.length; i++)
			{
				var item = results[i];
				this.add(item.id, item.schedule);
			}
		});

		// Starting heartbeat:
		this.interval = setInterval(() => {
			this.tick();
		}, config.scheduler.tickrate);
	},

	tick: function()
	{
		var now = new Date();
		this.queue = this.queue.filter((item, i) => {
			if (!item)
			{
				return false;
			}

			if (item.isFinished)
			{
				return false;
			}

			if (!item.isRunning && item.date <= now)
			{
				item.on("error", (phase, message) => {
					console.error(message);
				});
				item.on("starting", () => {
					console.log(item.trid, "is starting");
				});
				item.on("started", () => {
					console.log(item.trid, "has just started");
				});
				item.on("step.starting", (index) => {
					console.log("Starting step " + Math.floor(index + 1) + "/" + item.steps.length + " (" + item.steps[index].id + ")");
				});
				item.on("step.finished", (index, err, result) => {
					console.log("Finished step " + Math.floor(index + 1) + "/" + item.steps.length + " (" + item.steps[index].id + ")");
				});
				item.on("complete", () => {
					console.log(item.trid, "has just finished");
				});
				item.start();
				return true;
			}

			return true;
		});
	},

	add: function(trid, schedule)
	{
		var found = false;

		trid = parseInt(trid, 10);
		if (!trid || isNaN(trid) || trid <= 0)
		{
			trid = 0;
		}

		this.queue.map((value, index) => {
			if (value.trid === trid)
			{
				found = true;
			}

			return;
		});

		if (found)
		{
			return false;
		}

		this.queue.push(
			new Transaction(
				trid,
				schedule
			)
		);

		return true;
	}

};
