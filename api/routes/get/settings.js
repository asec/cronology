const EventEmitter = require("events"),
	schemas = require("../../../model/index.js");

class ApiFunction extends EventEmitter
{

	process(req)
	{
		schemas.User.findOne({ isAdmin: true }, (err, user) => {
			if (err)
			{
				this.emit("error", err);
				return;
			}

			if (!user)
			{
				this.emit("complete", {
					success: true,
					admin: null
				});
				return;
			}

			this.emit("complete", {
				success: true,
				admin: {
					id: user.id,
					username: user.username
				}
			});
		});
	}

}

module.exports = ApiFunction;
