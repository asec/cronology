const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model/index.js"),
	bcrypt = require("bcrypt");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var data = {
				username: req.body.username,
				password: req.body.password,
				isAdmin: false
			};

			if (!data.username || !data.password)
			{
				this.emit("error", new Error("You need to specify a valid username and a password."));
				return;
			}

			schemas.User.findOne({ username: data.username }, (err, user) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (user)
				{
					this.emit("error", new Error("There already exists a user by that username."));
					return;
				}

				bcrypt.hash(data.password, 10, (err, hash) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}

					data.password = hash;

					const entity = new schemas.User(data);
					entity.save((err, user) => {
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
