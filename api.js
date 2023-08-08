require("dotenv").config();
try
{
	require("dotenv").config({
		path: '.env.local',
		override: true,
	});
}
catch (e) {}

const db = require("./utils/db.js"),
	scheduler = require("./scheduler/scheduler.js"),
	api = require("./api/api-core.js");

scheduler.init();
api.init(scheduler);
