const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var limitStart = parseInt(req.query.start, 10);
		var limit = parseInt(req.query.limit, 10);
		if (!limitStart || isNaN(limitStart) || limitStart <= 0)
		{
			limitStart = 0;
		}
		if (!limit || isNaN(limit) || limit <= 0)
		{
			limit = 20;
		}

		schemas.Transaction.find().sort({ created: -1 }).skip(limitStart).limit(limit).exec((err, items) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			items = items.map((item, key) => {
				return {
					trid: item.id,
					originator: item.originator,
					owner: item.owner,
					name: item.name,
					schedule: item.schedule,
					starts: sr.resolve(item.schedule, new Date(item.created)),
					isRecurring: item.isRecurring,
					isRunning: item.isRunning,
					isFinished: item.isFinished,
					isCanceled: item.isCanceled,
					stepsGetterUrl: item.stepsGetterUrl,
					numSteps: item.numSteps,
					completedSteps: item.completedSteps,
					waitAfterStep: item.waitAfterStep,
					steps: item.steps,
					created: item.created,
					updated: item.updated
				};
			});

			this.emit("complete", {
				success: true,
				items: items
			});
		});
	}

}

module.exports = ApiFunction;
