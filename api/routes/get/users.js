const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, false, () => {
			var limitStart = parseInt(req.query.start, 10);
			var limit = parseInt(req.query.limit, 10);
			if (!limitStart || isNaN(limitStart) || limitStart <= 0)
			{
				limitStart = 0;
			}
			if (!limit || isNaN(limit) || limit <= 0)
			{
				limit = 0;
			}

			var q = schemas.User.find().sort({ isAdmin: -1 });
			if (limitStart > 0 || limit > 0)
			{
				q.skip(limitStart).limit(limit);
			}
			q.exec((err, items) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				items = items.map((entity, key) => {
					return {
						id: entity.id,
						username: entity.username,
						isAdmin: entity.isAdmin,
						accessToken: entity.accessToken,
						accessTokenValid: entity.accessTokenValid,
						loginDate: entity.loginDate,
						created: entity.created,
						updated: entity.updated
					};
				});

				this.emit("complete", {
					success: true,
					items: items
				});
			});
		});
	}

}

module.exports = ApiFunction;
