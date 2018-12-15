const EventEmitter = require("events");

class ApiFunction extends EventEmitter
{

	process(req, res, next, db, config)
	{
		var data = {
			name: req.body.name,
			schedule: req.body.schedule,
			waitAfterStep: parseInt(req.body.waitAfterStep, 10),
			steps: req.body.steps,
			numSteps: 0
		};
		if (!(data.steps instanceof Array) || !data.steps)
		{
			data.steps = [];
		}
		if (!data.waitAfterStep || isNaN(data.waitAfterStep) || data.waitAfterStep <= 0)
		{
			data.waitAfterStep = 0;
		}
		data.steps = data.steps.map((value, key) => {
			return value.url;
		});
		data.numSteps = data.steps.length;

		var message = {
			success: true
		};

		var q = "INSERT INTO ?? (`owner`, `name`, `schedule`, `numSteps`, `waitAfterStep`, `created`) VALUES (?, ?, ?, ?, ?, ?)";
		db.query(q, [config.dbt.TRANSACTIONS, 2, data.name, data.schedule, data.numSteps, data.waitAfterStep, new Date()], (err, results, fields) => {
			if (err)
			{
				return res.json({
					success: false,
					error: "MySQL query transaction error: " + (err.sqlMessage || err.message)
				});
			}

			message.trid = results.insertId;
			if (data.steps.length > 0)
			{
				var values = data.steps.map((value, key) => {
					return [
						message.trid,
						value,
						new Date()
					];
				});
				q = "INSERT INTO ?? (`trid`, `url`, `created`) VALUES ?";
				db.query(q, [config.dbt.STEPS, values], (err, results, fields) => {
					if (err)
					{
						q = "DELETE FROM ?? WHERE `trid` = ?";
						db.query(q, [config.dbt.STEPS, message.trid]);
						q = "DELETE FROM ?? WHERE `id` = ?";
						db.query(q, [config.dbt.TRANSACTIONS, message.trid]);
						return res.json({
							success: false,
							error: "MySQL query steps error: " + (err.sqlMessage || err.message)
						});
					}

					this.emit("success", message, data.schedule);

					return res.json(message);
				});
			}
			else
			{
				return res.json(message);
			}
		});
	}

}

module.exports = ApiFunction;
