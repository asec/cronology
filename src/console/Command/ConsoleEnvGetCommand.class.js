"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");

class ConsoleEnvGetCommand extends ConsoleCommand
{
    static name = "console-env-get";
    static description = "Tells you which environment the console is currently set to. This can be 'test'," +
        " 'dev' or 'prod'";

    static action()
    {
        this.printLine("\t" + process.env.APP_ENV);
    }
}

module.exports = {
    ConsoleEnvGetCommand
};