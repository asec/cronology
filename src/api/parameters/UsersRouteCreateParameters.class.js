"use strict";
const { AppAuthenticationParameters } = require("./AppAuthenticationParameters.class");
const validator = require("validator");
const { DisplayableApiException } = require("../../exception");

/**
 * @typedef {ApiRouteParameterBean} UsersRouteCreateParametersBean
 * @property {string} username
 * @property {string} password
 */

class UsersRouteCreateParameters extends AppAuthenticationParameters
{
    /**
     * @type {string}
     */
    username = "";
    /**
     * @type {string}
     */
    password = "";

    /**
     * @param {UsersRouteCreateParametersBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {UsersRouteCreateParametersBean} params
     */
    setAll(params)
    {
        super.setAll(params);
    }

    /**
     * @returns {UsersRouteCreateParameters}
     */
    static parse(request)
    {
        /**
         * @type {UsersRouteCreateParameters}
         */
        let result = super.parse(request);
        result.setAll(request.body);
        return result;
    }

    /**
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validate()
    {
        await super.validate();
        let usernameRegex = /^[a-zA-Z0-9_\-]{5,}$/;
        let errors = {
            username: "Invalid parameter: 'username'. Must be at least 5 characters long," +
                " must only contain lowercase and uppercase letters, numbers and the following characters: '_', '-'.",
            password: "Invalid parameter: 'password'. Must be at least 12 characters log, must contain at least one" +
                " uppercase letter, one lowercase letter, one number and one special character."
        };
        if (typeof this.username !== "string")
        {
            throw new DisplayableApiException(errors.username);
        }
        if (!validator.matches(this.username, usernameRegex))
        {
            throw new DisplayableApiException(errors.username);
        }

        if (typeof this.password !== "string")
        {
            throw new DisplayableApiException(errors.password);
        }
        if (!validator.isStrongPassword(this.password, { minLength: 12 }))
        {
            throw new DisplayableApiException(errors.password);
        }

        return true;
    }
}

module.exports = {
    UsersRouteCreateParameters
};