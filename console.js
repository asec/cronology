"use strict";
require("./config/dotenv").environment().extendWith(".env.console");
const { program } = require("commander");
const { Console } = require("./src/console/Console.class");
const { ConsoleCommand } = require("./src/console/ConsoleCommand.class");
/**
 * @type {Object.<string, ConsoleCommand>}
 */
const commands = require("./src/console/Command");

const packageInfo = require("./package.json");

program
    .name("console")
    .description("Local console for the cronology api.")
    .version(packageInfo.version, '-v, --version')
;

for (let className in commands)
{
    Console.addCommand(commands[className]);
}

program.parseAsync()
    .catch(error => console.error(error))
    .finally(() => process.exit());