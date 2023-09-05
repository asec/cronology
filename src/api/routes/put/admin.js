const EventEmitter = require("events"),
	schemas = require("../../../model"),
	bcrypt = require("bcryptjs");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var password = req.body.password;
		if (!password)
		{
			this.emit("error", new Error("You need to choose a password at least 9 charaters in length."));
			return;
		}
		schemas.User.findOne({ isAdmin: true }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (user)
			{
				this.emit("error", new Error("There exists an admin user already by the name '" + user.username + "'."));
				return;
			}

			schemas.User.findOne({ username: "admin" }, (err, user) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (user)
				{
					this.emit("error", new Error("There already is a user called 'admin'. This is strange inconsistency, please check the database."));
					return;
				}

				bcrypt.hash(password, 10, (err, hash) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					const entity = new schemas.User({
						username: "admin",
						isAdmin: true,
						password: hash
					});
					entity.save((err, entity) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						delete entity.password;
						this.emit("complete", {
							success: true,
							user: {
								id: entity.id,
								username: entity.username,
								isAdmin: entity.isAdmin,
								accessToken: entity.accessToken,
								accessTokenValid: entity.accessTokenValid,
								loginDate: entity.loginDate,
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
