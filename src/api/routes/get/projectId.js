const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var id = req.params.id;

			schemas.Project.findOne({ _id: id }, (err, entity) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (!entity)
				{
					this.emit("error", new Error("The requested project cannot be found."));
					return;
				}

				this.emit("complete", {
					success: true,
					project: {
						id: entity.id,
						name: entity.name,
						color: entity.color,
						participants: entity.participants,
						created: entity.created,
						updated: entity.updated
					}
				})
			});
		});
	}

}

module.exports = ApiFunction;
