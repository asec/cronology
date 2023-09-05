const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model"),
	bcrypt = require("bcryptjs");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var data = {
				id: req.params.id,
				username: req.body.username,
				password: req.body.password,
				isAdmin: !!req.body.isAdmin
			};

			if (!data.username)
			{
				this.emit("error", new Error("You need to specify a valid username and a password."));
				return;
			}

			this.on("process.pt2", (data) => {
				this.processPart2(data);
			});

			if (!data.isAdmin)
			{
				schemas.User.find({ isAdmin: true }, (err, items) => {
					if (err)
					{
						this.emit("error", err);
						return;
					}
	
					if (items.length < 1 || (items.length === 1 && items[0].id === data.id))
					{
						this.emit("error", new Error("You cant revoke the admin privileges from this user because there needs to be at least one admin in the API instance."));
						return;
					}
					else
					{
						this.emit("process.pt2", data);
						return;
					}
				});
			}
			else
			{
				this.emit("process.pt2", data);
				return;
			}
		});
	}

	processPart2(data)
	{
		schemas.User.findOne({ username: data.username }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (user && user.id !== data.id)
			{
				this.emit("error", new Error("There already exists a user by that username so you can't change the username of this users to that ones."));
				return;
			}

			schemas.User.findOne({ _id: data.id }, (err, entity) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				entity.username = data.username;
				entity.isAdmin = data.isAdmin;
				if (data.password)
				{
					bcrypt.hash(data.password, 10, (err, hash) => {
						if (err)
						{
							this.emit("error", err);
							return;
						}

						entity.password = hash;
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
				}
				else
				{
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
				}
			});
		});
	}

}

module.exports = ApiFunction;
