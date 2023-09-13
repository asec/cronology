"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { UsersRouteCreateParameters } = require("../../api/parameters/UsersRouteCreateParameters.class");
const { Api } = require("../../api/Api.class");
const { User } = require("../../model/User");

/**
 * @typedef {{}} CreateUserCommandOptions
 * @property {number} [passwordLength]
 */

class CreateUserCommand extends ConsoleCommand
{
    static name = "create-user";
    static description = "Creates a new user in the database."
    static args = [
        [
            "<username>",
            "Must be at least 5 characters long, can only contain lowercase letters," +
            " uppercase letters, numbers and the following characters: '-', '_'."
        ],
        [
            "[password]",
            "[Optional] Must be at least 12 characters long, must contain at least 1 lowercase letter, 1 uppercase letter, 1" +
            " number, 1 special character. If omitted will be randomly generated and displayed on success."
        ]
    ];
    static options = [
        [
            "-l, --password-length <length>",
            "The length of the randomly generated password. Only applicable when the command was not supplied with a" +
            " password.",
            20
        ]
    ];

    /**
     * @param {string} username
     * @param {string} [password]
     * @param {CreateUserCommandOptions} options
     */
    static async action(username, password, options)
    {
        let wasPasswordSupplied = password !== undefined;
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
        let params = new UsersRouteCreateParameters({
            username,
            password: wasPasswordSupplied ? password : User.generateRandomPassword(passwordLength)
        });

        await Api.init();

        let result = await Api.execute("put", "/user", params);
        let resultObj = result.toObject();
        if (resultObj.success && !wasPasswordSupplied)
        {
            resultObj.password = params.password;
        }

        this.printLine(resultObj);
    }
}

module.exports = {
    CreateUserCommand
};