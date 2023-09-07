"use strict";
const { ConsoleCommand } = require("./ConsoleCommand.class");
const { program } = require("commander");

class Console
{
    /**
     * @param {typeof ConsoleCommand} command
     */
    static addCommand(command)
    {
        let cmd = program.command(command.name);
        cmd.description(command.description);
        for (let i = 0; i < command.args.length; i++)
        {
            let argument = command.args[i];
            cmd.argument(argument[0], argument[1]);
        }
        cmd.action(command.action.bind(command));
    }
}

module.exports = {
    Console
};