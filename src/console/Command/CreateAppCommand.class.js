"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { ExternalApplication, ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { ApiResult, ApiError } = require("../../api/responses");
const db = require("../../utils/db");
const path = require("path");
const fs = require("fs");

/**
 * @typedef {{}} CreateAppCommandOptions
 * @property {boolean} force
 */

class CreateAppCommand extends ConsoleCommand
{
    static name = "create-app";
    static description = "Creates a new external application. They are needed for authenticating specific api " +
        "calls. The authentication is done by IP and request signature.";
    static args = [
        [
            "<app-name>",
            "The name of the app. Can only contain alphanumeric characters and the following symbols: '-', '_'." +
            " Must start with a letter."
        ]
    ];
    static options = [
        [
            "-f, --force",
            "Create new keys upon successful app creation even if the files already exists.",
            false
        ]
    ];

    /**
     * @param {string} appName
     * @param {CreateAppCommandOptions} options
     * @returns {Promise<void>}
     */
    static async action(appName, options)
    {
        await db.connect();
        let app = new ExternalApplication({
            name: appName
        });
        /**
         * @type {ApiResponse}
         */
        let response;
        console.log("\nChecking if app exists: '" + appName + "'");
        let existingApp = await ExternalApplicationRepository.findOne({ name: app.name });
        if (existingApp !== null)
        {
            response = new ApiError({
                error: "The app cannot be created because it already exists.",
                displayable: true
            });

            this.printLine(response.toObject());
            return;
        }
        try
        {
            let keys = app.getKeys();
            console.log("\nCreating keys:");
            console.log("\t" + keys.public);
            console.log("\t" + keys.private);
            if (!options.force && (fs.existsSync(keys.private) || fs.existsSync(keys.public)))
            {
                response = new ApiError({
                    error: "The keys cannot be generated as the files already exist. You can use the" +
                        " -f, --force option to overwrite them.",
                    displayable: true
                });

                this.printLine(response.toObject());
                return;
            }
            await app.generateKeys();
            console.log("\nSaving app into the database.");
            await app.save();
            response = new ApiResult({
                success: true,
                result: app.toObject()
            });
        }
        catch (e)
        {
            response = new ApiError({
                error: e.message,
                displayable: true
            });
        }

        this.printLine(response.toObject());
    }
}

module.exports = {
    CreateAppCommand
};