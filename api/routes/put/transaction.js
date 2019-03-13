const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var data = {
			name: req.body.name,
			schedule: req.body.schedule,
			waitAfterStep: parseInt(req.body.waitAfterStep, 10),
			steps: req.body.steps,
			numSteps: 0,
			stepsGetterUrl: req.body.stepsGetterUrl || ""
		};
		console.log(data);
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
			this.emit("complete", {
				success: false,
				error: "You can't pass a stepsGetterUrl AND an array of steps to this endpoint. You can have only one of them."
			});
			return;
		}
		if (!data.stepsGetterUrl && !data.steps.length)
		{
			this.emit("complete", {
				success: false,
				error: "You need to either specify the steps that will be executed in this transaction or pass a stepsGetterUrl."
			});
			return;
		}
		data.numSteps = data.steps.length;

		var date = sr.resolve(data.schedule);
		if (!date)
		{
			this.emit("complete", {
				success: false,
				error: "Scheduling error: It was not possible to establish a valid starting date based on the given schedule"
			});
			return;
		}
		if (sr.isRepeatable)
		{
			data.isRecurring = true;
		}

		schemas.User.findOne({ username: "admin" }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			var steps = data.steps;
			delete data.steps;

			data.owner = user;
			const entity = new schemas.Transaction(data);
			steps.map((value, key) => {
				entity.steps.push(new schemas.TransactionStep({
					transaction: entity.id,
					url: value
				}));
			});

			schemas.TransactionStep.insertMany(entity.steps, (err, items) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				entity.save((err, entity) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					this.emit("complete", {
						success: true,
						trid: entity.id
					});
					this.emit("success", entity.id, entity.schedule);
				});
			});
		});
	}

}

module.exports = ApiFunction;
