const EventEmitter = require("events"),
	sr = require("../../../utils/ScheduleResolver/ScheduleResolver.class.js"),
	schemas = require("../../../model");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var id = req.params.id;
		var page = parseInt(req.query.page, 10);
		var limit = parseInt(req.query.limit, 10);
		if (!page || isNaN(page) || page <= 1)
		{
			page = 1;
		}
		if (!limit || isNaN(limit) || limit <= 0)
		{
			limit = 20;
		}

		schemas.Transaction.find({ $or: [{ _id: id }, {originator: id}] }).sort({ created: -1 }).skip((page - 1) * limit).limit(limit).exec((err, items) => {
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

			schemas.Transaction.countDocuments({ $or: [{ _id: id }, {originator: id}] }).exec((err, count) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				this.emit("complete", {
					success: true,
					page: page,
					pages: Math.ceil(count / limit),
					items: items
				});

			});
		});
	}

}

module.exports = ApiFunction;
