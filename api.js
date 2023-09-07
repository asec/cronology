"use strict";
require("./config/dotenv").environment("test");
const { ApiWithExpress } = require("./src/api/ApiWithExpress.class");

ApiWithExpress.init();

/*const db = require("./utils/index.js"),
	scheduler = require("./scheduler/scheduler.js"),
	api = require("./api/api-core.js");*/

//scheduler.init();
//api.init(scheduler);