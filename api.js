var api = require("./api/api-core.js"),
	scheduler = require("./scheduler/scheduler.js");

scheduler.init();
api.init(scheduler);
