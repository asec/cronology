"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { UserRepository } = require("../../model/User");
const { ApiResponse, ApiError } = require("../../api/responses");
const db = require("../../utils/db");

class SetAdminCommand extends ConsoleCommand
{
    static name = "set-admin";
    static description = "Sets the `isAdmin` flag for <username> to <value>.";
    static args = [
        [
            "<username>",
            "The username of the user to modify."
        ],
        [
            "[value]",
            '{"true" | "false"}. The value of the `isAdmin` flag to set.',
            "true"
        ]
    ];

    /**
     * @param {string} username
     * @param {"true"|"false"} [value = "true"]
     * @returns {Promise<void>}
     */
    static async action(username, value = "true")
    {
        if (["true", "false"].indexOf(value) === -1)
        {
            this.printLine("\t[Error] Invalid argument `value`. Can only be `true` or `false`.");
            return;
        }

        await db.connect();
        let user = await UserRepository.findOne({ username });
        if (user === null)
        {
            this.printLine("\t[Error] The user does not exists: '" + username + "'.");
            return;
        }

        /**
         * @type {ApiResponse}
         */
        let apiResponse;

        try
        {
            user.isAdmin = (value === "true");
            await user.save();

            apiResponse = new ApiResponse({ success: true });
        }
        /**
         * @type {Error}
         */
        catch (e)
        {
            apiResponse = new ApiError({
                error: e.message,
                displayable: true
            });
        }

        this.printLine(apiResponse.toObject());
    }
}

module.exports = {
    SetAdminCommand
};