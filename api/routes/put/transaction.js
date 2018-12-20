const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js");

class ApiFunction extends EventEmitter
{

	process(req, res, next, db, config)
	{
		var data = {
			name: req.body.name,
			schedule: req.body.schedule,
			waitAfterStep: parseInt(req.body.waitAfterStep, 10),
			steps: req.body.steps,
			numSteps: 0,
			stepsGetterUrl: req.body.stepsGetterUrl || ""
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
		data.steps = data.steps.filter((value, key) => {
			return !!value;
		});
		if (data.stepsGetterUrl && data.steps.length > 0)
		{
			return res.json({
				success: false,
				error: "You can't pass a stepsGetterUrl AND an array of steps to this endpoint. You can have only one of them."
			});
		}
		if (!data.stepsGetterUrl && !data.steps.length)
		{
			return res.json({
				success: false,
				error: "You need to either specify the steps that will be executed in this transaction or pass a stepsGetterUrl."
			});
		}
		data.numSteps = data.steps.length;

		var message = {
			success: true
		};

		var date = sr.resolve(data.schedule);
		if (!date)
		{
			return res.json({
				success: false,
				error: "Scheduling error: It was not possible to establish a valid starting date based on the given schedule"
			});
		}

		var q = "INSERT INTO ?? (`owner`, `name`, `schedule`, `isRecurring`, `stepsGetterUrl`, `numSteps`, `waitAfterStep`, `created`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
		db.query(q, [config.dbt.TRANSACTIONS, 2, data.name, data.schedule, sr.isRepeatable ? 1 : 0, data.stepsGetterUrl, data.numSteps, data.waitAfterStep, new Date()], (err, results, fields) => {
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
				if (data.stepsGetterUrl)
				{
					this.emit("success", message, data.schedule);
				}
				return res.json(message);
			}
		});
	}

}

module.exports = ApiFunction;
