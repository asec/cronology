"use strict";
const { ApiAuthenticationBase } = require("./ApiAuthenticationBase.class");
const { DisplayableApiException } = require("../../exception");
const { UserRepository } = require("../../model/User");

/**
 * @typedef {BeanObject} UserValidationBean
 * @property {string} accessToken
 */

class UserValidation extends ApiAuthenticationBase
{
    /**
     * @type {string}
     */
    accessToken = "";
    /**
     * @type {User}
     */
    #user = null;

    /**
     * @protected
     * @returns {User}
     */
    get user()
    {
        return this.#user;
    }

    /**
     * @param {UserValidationBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "UserValidation")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {UserValidationBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UserValidationBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param request
     * @returns {UserValidation}
     */
    static parse(request)
    {
        return new UserValidation({
            accessToken: request.header("crnlg-access-token") || ""
        });
    }

    /**
     * @param [params]
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validate(params)
    {
        if (typeof this.accessToken !== "string" || !this.accessToken)
        {
            throw new DisplayableApiException("Invalid parameter: 'accessToken'.");
        }

        let user = await UserRepository.findOne({
            accessToken: this.accessToken
        });
        if (user === null)
        {
            throw new DisplayableApiException("Invalid parameter: 'accessToken'. The corresponding user" +
                " could not be found.");
        }

        this.#user = user;

        return true
    }
}

module.exports = {
    UserValidation
};