"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { UsersRouteCreateParameters } = require("../../api/parameters/UsersRouteCreateParameters.class");
const { Api } = require("../../api/Api.class");

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
            "<password>",
            "Must be at least 12 characters long, must contain at least 1 lowercase letter, 1 uppercase letter, 1" +
            " number, 1 special character."
        ]
    ];

    /**
     * @param {string} username
     * @param {string} password
     */
    static async action(username, password)
    {
        let params = new UsersRouteCreateParameters({
            username,
            password
        });

        await Api.init();

        let result = await Api.execute("put", "/user", params);

        this.printLine(result.toObject());
    }
}

module.exports = {
    CreateUserCommand
};