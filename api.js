var api = require("./api/api-core.js"),
	scheduler = require("./scheduler/scheduler.js");

//console.log(" --- ", sr.resolve("*/16 10 3 */3 */3"));

scheduler.init();
api.init(scheduler);
