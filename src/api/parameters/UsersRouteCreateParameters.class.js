"use strict";
const { AppAuthenticationParameters } = require("./AppAuthenticationParameters.class");
const validator = require("validator");
const { DisplayableApiException } = require("../../exception");
const { User } = require("../../model/User");

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
    password;

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
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UsersRouteCreateParameters}
     */
    static parse(req)
    {
        return super.parse(req);
    }

    /**
     * @protected
     * @param request
     * @param {UsersRouteCreateParameters} result
     * @returns {UsersRouteCreateParameters}
     */
    static parseOwn(request, result)
    {
        result.setAll(request.body);
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validateOwn()
    {
        let usernameRegex = /^[a-zA-Z0-9_\-.@]{5,100}$/;
        let errors = {
            username: "Invalid parameter: 'username'. Must be between 5 and 100 characters long," +
                " must only contain lowercase and uppercase letters, numbers and the following characters: '_'," +
                " '-', '.', '@'.",
            password: "Invalid parameter: 'password'. Must be at least 12 characters long, at most 100 characters long," +
                " must contain at least one uppercase letter, one lowercase letter, one number and one" +
                " special character."
        };
        if (typeof this.username !== "string")
        {
            throw new DisplayableApiException(errors.username);
        }
        if (!validator.matches(this.username, usernameRegex))
        {
            throw new DisplayableApiException(errors.username);
        }

        if (!this.password || typeof this.password !== "string")
        {
            this.set("password", User.generateRandomPassword());
        }
        if (!validator.isStrongPassword(this.password, { minLength: 12 }))
        {
            throw new DisplayableApiException(errors.password);
        }
        if (this.password.length > 100)
        {
            throw new DisplayableApiException(errors.password);
        }

        return true;
    }
}

module.exports = {
    UsersRouteCreateParameters
};