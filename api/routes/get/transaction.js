const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
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

		schemas.Transaction.find({ originator: null }).sort({ created: -1 }).skip((page - 1) * limit).limit(limit).exec((err, items) => {
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

			var grabLatestRun = (item) => {
				return new Promise((resolve, reject) => {
					schemas.Transaction.findOne({ originator: item.trid }).sort({ created: -1 }).exec((err, latest) => {
						if (err)
						{
							reject(err);
						}
						else if (!latest)
						{
							reject("No additional run detected for: " + item.trid);
						}
						else
						{
							resolve({
								trid: item.trid,
								originator: item.originator,
								owner: latest.owner,
								name: latest.name,
								schedule: latest.schedule,
								starts: sr.resolve(latest.schedule, new Date(latest.created)),
								isRecurring: latest.isRecurring,
								isRunning: latest.isRunning,
								isFinished: latest.isFinished,
								isCanceled: latest.isCanceled,
								stepsGetterUrl: latest.stepsGetterUrl,
								numSteps: latest.numSteps,
								completedSteps: latest.completedSteps,
								waitAfterStep: latest.waitAfterStep,
								steps: latest.steps,
								created: item.created,
								updated: latest.updated
							});
						}
					});
				});
			};

			var updateAllWithLatestRuns = async (items) => {
				for (let i = 0; i < items.length; i++)
				{
					try
					{
						items[i] = await (grabLatestRun(items[i]));
					}
					catch (err)
					{
						//console.log(err);
					}
				}

				return items;
			};

			updateAllWithLatestRuns(items).then((items) => {

				schemas.Transaction.countDocuments({ originator: null }).exec((err, count) => {
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
		});
	}

}

module.exports = ApiFunction;
