"use strict";
require("./config/dotenv").environment();
const { program } = require("commander");
const { Console } = require("./src/console/Console.class");
const { ScheduleCommand } = require("./src/console/Command");

program
    .name("console")
    .description("Local console for the cronology api.")
    .version("1.0.0", '-v, --version')
;

Console.addCommand(ScheduleCommand);

program.parse();