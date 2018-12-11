var scheduleResolver = require("../../../utils/scheduleResolver.js");

module.exports.getTransactionId = (req, res, next, db, config) => {

	var id = parseInt(req.params.id, 10);
	if (!id || isNaN(id) || id <= 0)
	{
		id = 0;
	}
	var message = {
		success: true
	};

	var q = "SELECT * FROM ?? WHERE `id` = ?";
	db.query(q, [config.dbt.TRANSACTIONS, id], (err, results, fields) => {
		if (err)
		{
			return res.json({
				success: false,
				error: "MySQL query transaction error: " + (err.sqlMessage || err.message)
			});
		}

		if (results.length !== 1)
		{
			return res.json({
				success: false,
				error: "The following transaction could not be found: " + id
			});
		}

		var item = results[0];
		message.item = {
			trid: item.id,
			name: item.name,
			schedule: scheduleResolver.resolve(item.schedule, new Date(item.created)),
			isRecurring: !!item.isRecurring,
			isRunning: !!item.isRunning,
			isCanceled: !!item.isCanceled,
			completedSteps: item.completedSteps,
			numSteps: item.numSteps,
			waitAfterStep: item.waitAfterStep,
			created: item.created,
			steps: []
		};

		q = "SELECT * FROM ?? WHERE `trid` = ? ORDER BY `id` ASC";
		db.query(q, [config.dbt.STEPS, id], (err, results, fields) => {
			if (err)
			{
				return res.json({
					success: false,
					error: "MySQL query transaction steps error: " + (err.sqlMessage || err.message)
				});
			}

			message.item.steps = results.map((item, key) => {
				return {
					stid: item.id,
					url: item.url,
					isRunning: !!item.isRunning,
					created: item.created,
					started: item.started || false,
					duration: item.duration || 0,
					result: item.result
				};
			});

			return res.json(message);
		});
	});

};
