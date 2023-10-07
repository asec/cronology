"use strict";
const { AppAuthenticationParameters } = require("./AppAuthenticationParameters.class");
const { DisplayableApiException } = require("../../exception");

const validator = require("validator");

/**
 * @typedef {ApiRouteParameterBean} UsersRouteCreateAccessTokenParametersBean
 * @property {string} user_id
 */

class UsersRouteCreateAccessTokenParameters extends AppAuthenticationParameters
{
    /**
     * @type {string}
     */
    user_id = "";

    /**
     * @param {UsersRouteCreateAccessTokenParametersBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {UsersRouteCreateAccessTokenParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UsersRouteCreateAccessTokenParameters}
     */
    static parse(request)
    {
        return super.parse(request);
    }

    /**
     * @protected
     * @param request
     * @param {UsersRouteCreateAccessTokenParameters} result
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
        if (typeof this.user_id !== "string" || !this.user_id)
        {
            throw new DisplayableApiException("Invalid parameter: 'user_id'.");
        }
        if (!validator.isMongoId(this.user_id))
        {
            throw new DisplayableApiException("Invalid parameter: 'user_id'.");
        }

        return true;
    }
}

module.exports = {
    UsersRouteCreateAccessTokenParameters
};