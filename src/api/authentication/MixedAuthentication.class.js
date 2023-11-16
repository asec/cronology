"use strict";
const { ApiAuthenticationBase } = require("./ApiAuthenticationBase.class");
const { AppAuthentication } = require("./AppAuthentication.class");
const { AppValidation } = require("./AppValidation.class");
const { UserValidation } = require("./UserValidation.class");

/**
 * @typedef {BeanObject} MixedAuthenticationBean
 * @property {AppAuthentication} [appAuthentication]
 * @property {AppValidation} [appValidation]
 * @property {UserValidation} [userValidation]
 */

/**
 * @typedef {BeanObject} MixedAuthenticationResultBean
 * @property {string|null} ip
 * @property {string|null} uuid
 * @property {string|null} signature
 * @property {string|null} accessToken
 */

class MixedAuthentication extends ApiAuthenticationBase
{
    /**
     * @type {AppAuthentication|null}
     */
    appAuthentication = null;
    /**
     * @type {AppValidation|null}
     */
    appValidation = null;
    /**
     * @type {UserValidation|null}
     */
    userValidation = null;

    /**
     * @returns {User|null}
     */
    get user()
    {
        if (this.userValidation !== null)
        {
            return this.userValidation.user;
        }

        return null;
    }

    /**
     * @returns {ExternalApplication|null}
     */
    get app()
    {
        if (this.appAuthentication !== null)
        {
            return this.appAuthentication.app;
        }
        if (this.appValidation !== null)
        {
            return this.appValidation.app;
        }

        return null;
    }

    /**
     * @param {MixedAuthenticationBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "MixedAuthentication")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {MixedAuthenticationBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {MixedAuthenticationResultBean}
     */
    toObject()
    {
        let data = {
            ip: null,
            uuid: null,
            signature: null,
            accessToken: null
        };
        if (this.appAuthentication)
        {
            data = {...data, ...this.appAuthentication.toObject()}
        }
        else if (this.appValidation && this.userValidation)
        {
            data = {...data, ...this.appValidation.toObject(), ...this.userValidation.toObject()}
        }
        return data;
    }

    /**
     * @param request
     * @returns {MixedAuthentication}
     */
    static parse(request)
    {
        /**
         * @type {MixedAuthentication}
         */
        let result;
        if (request.header("crnlg-access-token"))
        {
            result = new MixedAuthentication({
                appValidation: AppValidation.parse(request),
                userValidation: UserValidation.parse(request)
            });
        }
        else
        {
            result = new MixedAuthentication({
                appAuthentication: AppAuthentication.parse(request)
            });
        }

        return result;
    }

    async validate(params)
    {
        if (this.userValidation)
        {
            return await this.appValidation.validate(params) && await this.userValidation.validate(params);
        }

        return await this.appAuthentication.validate(params);
    }
}

module.exports = {
    MixedAuthentication
};