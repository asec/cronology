const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var id = req.params.id;
			schemas.User.deleteOne({ _id: id }, (err) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				this.emit("complete", {
					success: true,
					user: id
				});
			});
		});
	}

}

module.exports = ApiFunction;
