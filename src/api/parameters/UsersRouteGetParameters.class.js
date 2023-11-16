"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { MixedAuthentication} = require("../authentication");
const { DisplayableApiException } = require("../../exception");

/**
 * @typedef {ApiRouteParameterBean} UsersRouteGetParametersBean
 * @property {string|null} [username]
 */

class UsersRouteGetParameters extends ApiRouteParameters
{
    static authentication = [
        ...super.authentication,
        MixedAuthentication
    ];

    /**
     * @type {string|null}
     */
    username = null;

    /**
     * @returns {User}
     */
    get user()
    {
        if (!this.authenticators.length)
        {
            throw new DisplayableApiException("You need to populate the authenticators before you can access them.");
        }
        /**
         * @type {MixedAuthentication}
         */
        const authenticator = this.authenticators[0];
        if (!authenticator.user)
        {
            throw new DisplayableApiException("The user could not be found in the following authenticator: 0.");
        }

        return authenticator.user;
    }

    /**
     * @returns {ExternalApplication}
     */
    get app()
    {
        if (!this.authenticators.length)
        {
            throw new DisplayableApiException("You need to populate the authenticators before you can access them.");
        }
        /**
         * @type {MixedAuthentication}
         */
        const authenticator = this.authenticators[0];
        if (!authenticator.app)
        {
            throw new DisplayableApiException("The app could not be found in the following authenticator: 0.");
        }

        return authenticator.app;
    }

    /**
     * @param {UsersRouteGetParametersBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "UsersRouteGetParameters")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {UsersRouteGetParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UsersRouteGetParametersBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param req
     * @returns {UsersRouteGetParameters}
     */
    static parse(req)
    {
        return super.parse(req);
    }

    /**
     * @protected
     * @param req
     * @param {UsersRouteGetParameters} result
     */
    static parseOwn(req, result)
    {
        if (result.authentication.signature || !result.authentication.accessToken)
        {
            result.username = req.body.username || "";
        }
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validateOwn()
    {
        if (this.username !== null)
        {
            if (!this.username || typeof this.username !== "string")
            {
                throw new DisplayableApiException("Invalid parameter: 'username'.");
            }
        }

        return true;
    }
}

module.exports = {
    UsersRouteGetParameters
};