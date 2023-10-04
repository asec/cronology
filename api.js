"use strict";
const { program } = require("commander");

program
    .name("api")
    .description("Runs the REST API server.")
    .version("1.0.0", "-v, --version")
    .option("--test", "Starts the server in test environment. This is useful for integration tests (ie." +
        " for the PHP app). This will use the test database and makes the test endpoints available for use.")
;

program.parse();
const options = program.opts();

require("./config/dotenv").environment(options.test ? "test" : "dev");
const { ApiWithExpress } = require("./src/api/ApiWithExpress.class");

ApiWithExpress.init();

/*const db = require("./utils/index.js"),
	scheduler = require("./scheduler/scheduler.js"),
	api = require("./api/api-core.js");*/

//scheduler.init();
//api.init(scheduler);