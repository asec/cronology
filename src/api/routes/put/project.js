const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model"),
	mongoose = require("mongoose");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var data = {
				name: req.body.name,
				color: req.body.color,
				participants: req.body.users.split(",")
			};

			data.participants = data.participants.filter((item) => {
				return !!item;
			});

			if (!data.name || !data.color || !data.participants.length)
			{
				this.emit("error", new Error("You need to specify a name, a color and some participants for your project."));
				return;
			}

			data.participants.map((user, index) => {
				return mongoose.Types.ObjectId(user)
			});
			schemas.User.find({ '_id': { $in: data.participants } }, (err, users) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (users.length !== data.participants.length)
				{
					this.emit("error", new Error("You specified some invalid users while creating the project. Invalid users are not allowed."));
					return;
				}

				schemas.Project.findOne({ name: data.name }, (err, project) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					if (project)
					{
						this.emit("error", new Error("There already exists a project with this name."));
						return;
					}

					const entity = new schemas.Project(data);
					entity.save((err, project) => {
						if (err)
						{
							this.emit("error", err);
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
						});
					});
				});
			});
		});
	}

}

module.exports = ApiFunction;