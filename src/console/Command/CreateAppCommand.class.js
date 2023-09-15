"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { ExternalApplication, ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { ApiResult, ApiError } = require("../../api/responses");
const db = require("../../utils/db");

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

    static async action(appName)
    {
        await db.connect();
        let app = new ExternalApplication({
            name: appName
        });
        /**
         * @type {ApiResponse}
         */
        let response;
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
            await app.generateKeys();
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