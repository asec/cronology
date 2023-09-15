"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { ApiError, ApiResult } = require("../../api/responses");
const db = require("../../utils/db");

class AppSignatureCommand extends ConsoleCommand
{
    static name = "app-signature";
    static description = "Generates a signature for given app and data."
    static args = [
        [
            "<app-name>",
            "The name of the app. This is for console use only. The actual requests have to include the uuid in the" +
            " `Crnlg-App` header instead."
        ],
        [
            "<data>",
            "A stringified JSON object. This is usually the request body with the IP of the server appended at the end."
        ]
    ];

    /**
     * @param {string} appName
     * @param {string} data
     */
    static async action(appName, data)
    {
        await db.connect();
        let app = await ExternalApplicationRepository.findOne({ name: appName });
        if (app === null)
        {
            return this.#resultInError("[Error] Invalid parameter: 'app'. The following app does not exists: '" + appName + "'");
        }
        let object = {};
        try
        {
            object = JSON.parse(data);
        }
        /**
         * @type Error
         */
        catch (e)
        {
            return this.#resultInError("[Error] Invalid parameter: 'data'. Cannot be parsed as JSON data: " + e.message);
        }

        let signature = await app.generateSignature(object);
        let response = new ApiResult({
            success: true,
            result: signature
        });
        this.printLine(response.toObject());
    }

    /**
     * @param {string} message
     */
    static #resultInError(message)
    {
        let error = new ApiError({
            error: message,
            displayable: true
        });
        this.printLine(error.toObject());
    }
}

module.exports = {
    AppSignatureCommand
};