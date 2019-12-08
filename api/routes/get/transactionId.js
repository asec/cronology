const EventEmitter = require("events"),
	sr = require("../../../utils/scheduleResolver.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var id = req.params.id;
		var isLive = !!req.query.live;

		schemas.Transaction.findOne({ _id: id }).populate(["steps", "owner"]).exec((err, item) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (!item)
			{
				this.emit("error", new Error("The transaction does not exists."));
				return;
			}

			var items = [item];
			items = items.map((item, key) => {
				return {
					trid: item.id,
					originator: item.originator,
					owner: {
						id: item.owner.id,
						name: item.owner.name,
						color: item.owner.color,
						participants: item.owner.participants,
						created: item.owner.created,
						updated: item.owner.updated
					},
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

			if (isLive)
			{
				var grabLatestRun = (item) => {
					return new Promise((resolve, reject) => {
						schemas.Transaction.findOne({ originator: item.trid }).populate(["steps", "owner"]).sort({ created: -1 }).exec((err, latest) => {
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
									owner: {
										id: latest.owner.id,
										name: latest.owner.name,
										color: latest.owner.color,
										participants: latest.owner.participants,
										created: latest.owner.created,
										updated: latest.owner.updated
									},
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
									steps: latest.steps.map((step, key2) => {
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
					this.emit("complete", {
						success: true,
						item: items[0]
					});
				});
			}
			else
			{
				this.emit("complete", {
					success: true,
					item: items[0]
				});
			}
		});
	}

}

module.exports = ApiFunction;
