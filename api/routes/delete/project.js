const ApiFunctionAuthenticable = require("../authenticable.js"),
	schemas = require("../../../model/index.js");

class ApiFunction extends ApiFunctionAuthenticable
{

	process(req)
	{
		this.authenticate(req, true, () => {
			var id = req.params.id;
			schemas.Project.deleteOne({ _id: id }, (err) => {
				if (err)
				{
					this.emit("error", err);
					return;
				}

				this.emit("complete", {
					success: true,
					id: id
				});
			});
		});
	}

}

module.exports = ApiFunction;
