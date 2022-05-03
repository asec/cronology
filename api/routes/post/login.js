const EventEmitter = require("events"),
	schemas = require("../../../model/index.js"),
	config = require("../../../config/config.js"),
	bcrypt = require("bcryptjs");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		var data = {
			username: req.body.username,
			password: req.body.password
		};
		if (!data.username || !data.password)
		{
			this.emit("error", new Error("You need to specify a username and a password to log in."));
			return;
		}

		schemas.User.findOne({ username: data.username }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (!user)
			{
				this.emit("error", new Error("Invalid login credentials. Please check the username and password you entered."));
				return;
			}

			/*if (!user.isAdmin)
			{
				this.emit("error", new Error("You need to be an administrator in order to log in here."));
				return;
			}*/

			bcrypt.compare(data.password, user.password, (err, res) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (!res)
				{
					this.emit("error", new Error("Invalid login credentials. Please check the username and password you entered."));
					return;
				}

				const now = new Date();
				if (user.accessTokenValid && user.accessTokenValid >= now)
				{
					user.accessTokenValid = new Date(now.getTime() + config.api.userSessionLength * 60 * 1000);
					user.loginDate = now; // That's debatable, need to think about it still...
					user.save((err, r) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						delete user.password;
						this.emit("complete", {
							success: true,
							user: {
								id: user.id,
								username: user.username,
								isAdmin: user.isAdmin,
								accessToken: user.accessToken,
								accessTokenValid: user.accessTokenValid,
								loginDate: user.loginDate,
								created: user.created,
								updated: user.updated
							}
						});
					});
				}
				else
				{
					bcrypt.hash(user.id + Math.random(), 5, (err, accessToken) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						user.accessToken = accessToken;
						user.accessTokenValid = new Date(now.getTime() + config.api.userSessionLength * 60 * 1000);
						user.loginDate = now;
						user.save((err, r) => {
							if (err)
							{
								this.emit("error", err);
								return;
							}

							delete user.password;
							this.emit("complete", {
								success: true,
								user: {
									id: user.id,
									username: user.username,
									isAdmin: user.isAdmin,
									accessToken: user.accessToken,
									accessTokenValid: user.accessTokenValid,
									loginDate: user.loginDate,
									created: user.created,
									updated: user.updated
								}
							});
						});
					});
				}
			});

		});
	}

}

module.exports = ApiFunction;
