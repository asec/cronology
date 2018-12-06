var db = require("../utils/db.js"),
	config = require("../config/config.js");

module.exports = {

	log: function(cnf, callback)
	{
		var item = {
			trid: cnf.trid || 0,
			stid: cnf.stid || 0,
			action: cnf.action || "generic log entry",
			data: cnf.data || {},
			request: cnf.request || "",
			response: cnf.response || "",
			status: cnf.status || "",
			date: new Date(),
			duration: 0
		};

		item.data = JSON.stringify(item.data);

		var q = "INSERT INTO `" + config.dbt.LOGS + "` SET ?";
		db.connection.query(q, item, (error, results, fields) => {
			if (callback instanceof Function)
			{
				callback(error, results, fields);
			}
		});
	}

};
