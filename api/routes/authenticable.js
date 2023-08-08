const EventEmitter = require("events"),
	schemas = require("../../model/index.js");

class ApiFunctionAuthenticable extends EventEmitter
{

	authenticate(req, needsToBeAdmin, cb)
	{
		needsToBeAdmin = !!needsToBeAdmin;
		const accessToken = req.body.accessToken || req.query.accessToken;
		if (!accessToken)
		{
			this.emit("error", new Error("You need to provide an authenticated accessToken for this request."));
			return;
		}

		schemas.User.findOne({ accessToken: accessToken }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (!user)
			{
				this.emit("error", new Error("You need to provide an authenticated accessToken for this request."));
				return;
			}

			const now = new Date();
			/*if (user.accessTokenValid < now)
			{
				this.emit("error", new Error("This accessToken has already expired. Please re-authenticate the client."));
				return;
			}*/

			if (needsToBeAdmin && !user.isAdmin)
			{
				this.emit("error", new Error("You need to be an administrator in order to request this resource."));
				return;
			}

			user.accessTokenValid = new Date(now.getTime() + process.env.CONF_API_USERSESSION_LENGTH * 60 * 1000);
			user.save((err, r) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				if (cb instanceof Function)
				{
					return cb(req);
				}
			});
		});
	}

}

module.exports = ApiFunctionAuthenticable;
