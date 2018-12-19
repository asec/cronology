var api = require("./api/api-core.js"),
	scheduler = require("./scheduler/scheduler.js"),
	sr = require("./utils/scheduleResolver.js");

//console.log(" --- ", sr.resolve("*/16 10 3 */3 */3"));
console.log(" --- ", sr.resolve("* * * * *"), sr.isRepeatable);


//scheduler.init();
//api.init(scheduler);
