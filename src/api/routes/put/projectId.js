const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model"),
	mongoose = require("mongoose");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var data = {
				id: req.params.id,
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
					this.emit("error", new Error("You specified some invalid users while updating the project. Invalid users are not allowed."));
					return;
				}

				schemas.Project.findOne({ name: data.name }, (err, project) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					if (project && project.id !== data.id)
					{
						this.emit("error", new Error("There already exists a project by that name so you can't change the name of this projects to that ones."));
						return;
					}

					schemas.Project.findOne({ _id: data.id }, (err, entity) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						entity.name = data.name;
						entity.color = data.color;
						entity.participants = data.participants;
						entity.save((err, project) => {
							if (err)
							{
								this.emit("error", err);
								return;
							}

							this.emit("complete", {
								success: true,
								project: {
									id: project.id,
									name: project.name,
									color: project.color,
									participants: project.participants,
									created: entity.created,
									updated: entity.updated
								}
							});
						});
					});
				});
			});
		});
	}

}

module.exports = ApiFunction;