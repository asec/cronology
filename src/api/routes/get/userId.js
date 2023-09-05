const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var id = req.params.id;

			schemas.User.findOne({ _id: id }, (err, entity) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (!entity)
				{
					this.emit("error", new Error("The requested user cannot be found."));
					return;
				}

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
				})
			});
		});
	}

}

module.exports = ApiFunction;
