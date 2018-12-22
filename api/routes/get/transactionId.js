const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var id = req.params.id;

		schemas.Transaction.findOne({ _id: id }).populate("steps").exec((err, item) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			var items = [item];
			items = items.map((item, key) => {
				return {
					trid: item.id,
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
					steps: item.steps.map((step, key2) => {
						return {
							stid: step.id,
							url: step.url,
							isRunning: step.isRunning,
							started: step.started,
							duration: step.duration,
							result: step.result,
							created: step.created,
							updated: step.updated
						};
					}),
					created: item.created,
					updated: item.updated
				};
			});

			this.emit("complete", {
				success: true,
				item: items[0]
			});
		});
	}

}

module.exports = ApiFunction;
