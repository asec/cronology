"use strict";
const env = require("../../../config/dotenv")
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { Log } = require("../../model/Log");
const { ApiResult, ApiError } = require("../../api/responses");

const db = require("../../utils/db");
const path = require("path");

class LogsPullCommand extends ConsoleCommand
{
    static name = "logs-pull";
    static description = "Pulls up lines from the designated log file and saves them into the database if" +
        " they are missing.";
    static options = [
        [
            "-f, --file <fileName>",
            "Pull data from the specified file. The file has to be in the folder specified by the 'CONF_LOG_DIR'" +
            " variable on the current environment. Defaults to the current log file used by the Log model.",
            ""
        ]
    ];

    static async action(options)
    {
        env.disableLogging();
        const logDir = process.env.CONF_LOG_DIR || "./";
        const fileName = options.file;
        await db.connect();
        let pulledLines = 0;
        /**
         * @type {ApiResponse}
         */
        let result;

        try
        {
            pulledLines = await Log.pullFromFile(fileName);
            result = new ApiResult({
                success: true,
                result: {
                    file: path.resolve(logDir + "/" + (fileName || Log.getLogFile())),
                    pulledLines
                }
            });
        }
        /**
         * @type {Error}
         */
        catch (e)
        {
            result = new ApiError({
                error: e.message,
                displayable: true
            });
        }

        this.printLine(result.toObject());
    }
}

module.exports = {
    LogsPullCommand
};