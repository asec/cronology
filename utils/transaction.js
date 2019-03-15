const EventEmitter = require("events"),
	schemas = require("../model/index.js"),
	sr = require("./scheduleResolver.js"),
	profiler = require("./profiler.js"),
	Request = require("./request.js");

class Transaction extends EventEmitter
{

	constructor(trid, schedule)
	{
		super();
		this.trid = trid;
		this.entity = null;
		this.starts = sr.resolve(schedule);
		this.totalTime = 0;
		this.isRunning = false;
		this.isFinished = false;
		this.request = null;
		this.timeout = null;

		this.on("error", this.handleError);
		this.on("canceled", this.handleCanceled);
		this.on("finish", this.finish);
	}

	handleError(phase, message)
	{
		if (phase === "load" || phase === "step" || phase === "canceled")
		{
			schemas.Log.create({
				transaction: this.trid,
				action: "transaction error",
				data: {
					phase: phase,
					message: message
				},
				duration: profiler.mark()
			});
			this.emit("finish");
		}
	}

	handleCanceled(date)
	{
		schemas.Log.create({
			transaction: this.trid,
			action: "transaction canceled",
			data: {
				date: date
			},
			duration: profiler.mark()
		});

		this.emit("finish");
	}

	finish()
	{
		this.isRunning = false;
		this.isFinished = true;

		schemas.Log.create({
			transaction: this.trid,
			action: "transaction finished",
			duration: this.totalTime
		});

		if (this.entity)
		{
			this.entity.updateOne({ isRunning: false, isFinished: !this.entity.isRecurring, completedSteps: this.entity.completedSteps }, (err, r) => {
				if (err)
				{
					this.emit("error", "load", err.message);
					return;
				}

				this.emit("complete");
			});
		}
	}

	start()
	{
		this.isRunning = true;
		this.isFinished = false;
		profiler.start();

		schemas.Log.create({
			trid: this.trid,
			action: "transaction starting"
		});

		this.emit("starting");
		this.load();
	}

	load()
	{
		if (!this.entity)
		{
			schemas.Transaction.findById(this.trid).populate("steps").exec((err, item) => {
				if (err)
				{
					this.emit("error", "load", err.message);
					return;
				}

				if (!item)
				{
					this.emit("error", "load", "The following transaction could not be found: " + this.trid)
				}

				this.entity = item;
				this.loadSteps();
			});
		}
		else
		{
			this.loadSteps();
		}
	}

	loadSteps()
	{
		if (!this.entity.steps.length)
		{
			if (this.entity.stepsGetterUrl)
			{
				schemas.Log.create({
					transaction: this.trid,
					action: "transaction getting steps",
					data: {
						url: this.entity.stepsGetterUrl
					}
				});

				var started = profiler.mark();
				this.request = new Request(this.entity.stepsGetterUrl, true);
				this.request.on("error", (err) => {
					this.emit("error", "step", err.message);
				});
				this.request.on("request.error", (request, err) => {
					schemas.Log.create({
						transaction: this.trid,
						action: "transaction getting steps error",
						data: {
							message: (err.code ? err.code + ":" : "") + err.message,
							request: request
						},
						duration: profiler.mark()
					});

					this.emit("error", "load", err.message);
				});
				this.request.on("request.complete", (request, response, data) => {
					schemas.Log.create({
						transaction: this.trid,
						action: "transaction getting steps response",
						data: {
							request: request,
							response: {
								headers: response.headers,
								body: response.body
							}
						},
						status: response.status,
						duration: profiler.mark()
					});

					if (response.status !== 200)
					{
						this.emit("error", "load", "Could not get any valid steps from stepsGetterUrl #1.");
						return;
					}

					if (!data || !(data instanceof Array) || !data.length)
					{
						this.emit("error", "load", "Could not get any valid steps from stepsGetterUrl #2.");
						return;
					}

					var steps = data.map((value, key) => {
						return value.url;
					});
					steps = steps.filter((value, key) => {
						return !!value;
					});

					if (!steps.length)
					{
						this.emit("error", "load", "Could not get any valid steps from stepsGetterUrl #3.");
						return;
					}

					steps.map((value, key) => {
						this.entity.steps.push(new schemas.TransactionStep({
							transaction: this.entity.id,
							url: value
						}));
					});

					schemas.TransactionStep.insertMany(this.entity.steps, (err, items) => {
						if (err)
						{
							this.emit("error", "load", err.message);
							return;
						}

						this.entity.save((err, entity) => {
							if (err)
							{
								this.emit("error", "load", err.message);
								return;
							}

							this.emit("loaded");
							this.setRunningFlag();
						});
					});
				});
				this.request.execute();
			}
			else
			{
				this.emit("error", "load-steps", "There are no steps for this transaction and no url to load them either.");
			}
		}
		else
		{
			this.emit("loaded");
			this.setRunningFlag();
		}
	}

	setRunningFlag()
	{
		this.entity.updateOne({ isRunning: true }, (err, r) => {
			if (err)
			{
				this.emit("error", "load", err.message);
				return;
			}

			this.emit("started");
			this.doProgress();
		});
	}

	doProgress()
	{
		for (var i = 0; i < this.entity.steps.length; i++)
		{
			var step = this.entity.steps[i];
			if (step.result === "none")
			{
				this.totalTime += profiler.get(true);
				profiler.start();
				this.emit("step.starting", i);

				step.updateOne({ isRunning: true, started: new Date() }, (err, r) => {
					if (err)
					{
						this.emit("error", "step", err.message);
						return;
					}

					schemas.Log.create({
						transaction: this.trid,
						step: step.id,
						action: "step starting"
					});

					this.request = new Request(step.url);
					this.request.on("error", (err) => {
						this.emit("error", "step", err.message);
					});
					this.request.on("request.error", (request, err) => {
						if (!this.entity.isCanceled)
						{
							schemas.Log.create({
								transaction: this.trid,
								step: step.id,
								action: "step error",
								data: {
									message: err.code + ":" + err.message,
									request: request
								},
								duration: profiler.mark()
							});
						}

						step.updateOne({ isRunning: false, duration: profiler.get(true), result: "error" }, (error, r) => {
							step.result = "error";
							if (error)
							{
								this.emit("error", "step", error.message);
								return;
							}

							if (!this.entity.isCanceled)
							{
								this.emit("error", "step", "During step " + (Math.floor(i + 1) + "/" + this.entity.steps.length) + ": " + err.message);
								this.emit("step.finished", i, err, null);
							}
						});
					});
					this.request.on("request.complete", (request, response, data) => {
						schemas.Log.create({
							transaction: this.trid,
							step: step.id,
							action: "step response arrived",
							data: {
								request: request,
								response: {
									headers: response.headers,
									body: response.body
								}
							},
							status: response.status,
							duration: profiler.mark()
						});

						if (response.status !== 200)
						{
							step.updateOne({ isRunning: false, duration: profiler.get(true), result: "error" }, (err, r) => {
								step.result = "success";
								if (err)
								{
									this.emit("error", "step", err.message);
									return;
								}

								this.totalTime += profiler.get(true);
								this.emit("finish");
							});
						}
						else
						{
							step.updateOne({ isRunning: false, duration: profiler.get(true), result: "success" }, (err, r) => {
								step.result = "success";
								if (err)
								{
									this.emit("error", "step", err.message);
									return;
								}

								this.totalTime += profiler.get(true);
								var isThereMore = (i <= this.entity.steps.length - 1);
								var isLastStep = (i === this.entity.steps.length - 1);
								if (isThereMore)
								{
									this.entity.completedSteps++;
									this.entity.save((err, copy) => {
										// TODO: Hibajelzés esetleg
									});
									if (this.entity.waitAfterStep > 0 && !isLastStep)
									{
										this.timeout = setTimeout(() => {
											this.doProgress();
										}, this.entity.waitAfterStep * 1000);
									}
									else
									{
										this.doProgress();
									}
								}
								else
								{
									this.emit("finish");
								}
								return;
							});
						}
						this.emit("step.finished", i, null, response);
					});
					this.request.execute();
				});
				break;
			}
		}
		if (i > this.entity.steps.length - 1)
		{
			this.emit("finish");
		}
	}

	scheduleAgain()
	{
		if (!this.entity || !this.entity.id || !this.entity.isRecurring)
		{
			return false;
		}

		this.entity.updateOne({ isFinished: true }, (err, r) => {
			if (err)
			{
				this.emit("error", "schedule-again", err.message);
				return;
			}

			schemas.Log.create({
				transaction: this.trid,
				action: "transaction schedule-again"
			});

			if (!this.entity.originator)
			{
				this.entity.originator = this.trid;
			}
			var copy = new schemas.Transaction({
				originator: this.entity.originator || this.trid,
				owner: this.entity.owner,
				name: this.entity.name,
				schedule: this.entity.schedule,
				isRecurring: this.entity.isRecurring,
				stepsGetterUrl: this.entity.stepsGetterUrl,
				numSteps: 0,
				completedSteps: 0,
				waitAfterStep: this.entity.waitAfterStep
			});

			if (!this.entity.stepsGetterUrl)
			{
				this.entity.steps.map((step, key) => {
					copy.steps.push(new schemas.TransactionStep({
						transaction: copy.id,
						url: step.url
					}));
				});

				schemas.TransactionStep.insertMany(copy.steps, (err, items) => {
					if (err)
					{
						this.emit("error", "schedule-again", err.message);
						return;
					}

					copy.save((err, copy) => {
						if (err)
						{
							this.emit("error", "schedule-again", err.message);
							return;
						}

						this.emit("schedule.complete", copy.id, copy.schedule);
					});
				});
			}
			else
			{
				copy.save((err, copy) => {
					if (err)
					{
						this.emit("error", "schedule-again", err.message);
						return;
					}

					this.emit("schedule.complete", copy.id, copy.schedule);
				});
			}
		});
	}

	cancel()
	{
		clearTimeout(this.timeout);
		this.timeout = null;
		this.entity.isCanceled = true;
		if (this.request)
		{
			this.request.abort();
		}
		this.emit("canceled", new Date());
	}

}

module.exports = Transaction;
