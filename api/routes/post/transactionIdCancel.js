const EventEmitter = require("events"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req, scheduler)
	{
		var id = req.params.id;
		schemas.Transaction.findOne({ $or: [{ _id: id }, {originator: id}] }).populate("originator").sort({ created: -1 }).exec((err, item) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (!item || !item.id)
			{
				this.emit("error", new Error("The following transaction could not be found: " + id));
				return;
			}

			if (item.isFinished)
			{
				this.emit("error", new Error("The transaction has already been finished, it cannot be cancelled: " + id));
				return;
			}

			if (item.isCanceled)
			{
				this.emit("error", new Error("The transaction has already been canceled: " + id));
				return;
			}

			var found = false;
			scheduler.queue.map((task, index) => {
				if (task.trid === item.id || task.originator === item.id)
				{
					found = true;
					item.updateOne({ isCanceled: true }, (err, r) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						task.cancel();
						this.emit("complete", {
							success: true
						});
					});
				}
			});

			if (!found)
			{
				item.updateOne({ isCanceled: true }, (err, r) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					this.emit("complete", {
						success: true
					});
				});
			}
		});
	}

}

module.exports = ApiFunction;
