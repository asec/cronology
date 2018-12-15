var mysql = require("mysql"),
	config = require("../config/config.js");

module.exports = {

	connection: null,

	dbConnect: function()
	{
		var self = this;
		console.error("Connecting to database");
		self.connection = mysql.createConnection(config.mysql);
		self.connection.connect((err) => {
			if (err)
			{
				console.error("Error while connecting to database:", err.code);
				setTimeout(() => {
					self.dbConnect();
				}, 100);
			}
			else
			{
				console.error("CONNECTED to database");
			}
		});
		self.connection.on("error", (err) => {
			if (err.fatal)
			{
				setTimeout(() => {
					self.dbConnect();
				}, 100);
			}
		});
	}

};
