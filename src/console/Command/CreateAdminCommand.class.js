"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { UsersRouteCreateParameters } = require("../../api/parameters/UsersRouteCreateParameters.class");
const { Api } = require("../../api/Api.class");
const { User, UserRepository } = require("../../model/User");
const { ApiResponse, ApiError } = require("../../api/responses");

/**
 * @typedef {{}} CreateAdminCommandOptions
 * @property {number} [passwordLength]
 */

class CreateAdminCommand extends ConsoleCommand
{
    static name = "create-admin";
    static description = "Sets the `isAdmin` flag true for the user. If the user specified by <username> does" +
        " not exist it will be created."
    static args = [
        [
            "<username>",
            "Must be at least 5 characters long, can only contain lowercase letters," +
            " uppercase letters, numbers and the following characters: '-', '_'."
        ],
        [
            "[password]",
            "[Optional] Only applies when the user does not exist and needs to be created. Must be at least 12" +
            " characters long, must contain at least 1 lowercase letter, 1 uppercase letter, 1" +
            " number, 1 special character. If omitted will be randomly generated and displayed on success."
        ]
    ];
    static options = [
        [
            "-l, --password-length <length>",
            "The length of the randomly generated password. Only applicable when the user needs to be created and the" +
            " command was not supplied with a password.",
            20
        ]
    ];

    /**
     * @param {string} username
     * @param {string} [password]
     * @param {CreateAdminCommandOptions} options
     */
    static async action(username, password, options)
    {
        await Api.init();
        let user = await UserRepository.findOne({ username });
        let wasPasswordSupplied = password !== undefined;
        let wasUserCreated = false;
        let newPassword = "";

        if (user !== null && wasPasswordSupplied)
        {
            this.printLine("\t[Warning] The user already exists and a password was supplied. The users" +
                " password remains unchanged.");
        }

        if (user === null)
        {
            let passwordLength = 20;
            if (!wasPasswordSupplied)
            {
                passwordLength = options.passwordLength;
                if (!passwordLength || isNaN(passwordLength) || passwordLength < 20)
                {
                    this.printLine("\tError in option `-l, --password-length`: The value must be a number greater than 20.");
                    return;
                }
            }
            if (!wasPasswordSupplied)
            {
                newPassword = User.generateRandomPassword(passwordLength);
            }
            let params = new UsersRouteCreateParameters({
                username,
                password: wasPasswordSupplied ? password : newPassword
            });

            let result = await Api.execute("put", "/user", params);
            let resultObj = result.toObject();
            if (resultObj.success && !wasPasswordSupplied)
            {
                resultObj.password = params.password;
            }

            if (!resultObj.success)
            {
                this.printLine(resultObj);
                return;
            }

            user = await UserRepository.findOne({ username });
            wasUserCreated = true;
        }

        /**
         * @type {ApiResponse}
         */
        let result;

        try
        {
            user.isAdmin = true;
            await user.save();

            result = new ApiResponse({ success: true });
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

        let resultObj = result.toObject();
        resultObj.username = username;
        if (wasUserCreated && !wasPasswordSupplied)
        {
            resultObj.password = newPassword;
        }

        this.printLine(resultObj);
    }
}

module.exports = {
    CreateAdminCommand
};