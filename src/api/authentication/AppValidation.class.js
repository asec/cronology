"use strict";
const { ApiAuthenticationBase } = require("./ApiAuthenticationBase.class");
const { DisplayableApiException } = require("../../exception");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

/**
 * @typedef {BeanObject} AppValidationBean
 * @property {string} uuid
 * @property {string} ip
 */

class AppValidation extends ApiAuthenticationBase
{
    /**
     * @type {string}
     */
    uuid = "";
    /**
     * @type {string}
     */
    ip = "";
    /**
     * @type {ExternalApplication}
     */
    #app = null;

    get app()
    {
        return this.#app;
    }

    /**
     * @param {AppValidationBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "AppValidation")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {AppValidationBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {AppValidationBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param request
     * @returns {AppValidation}
     */
    static parse(request)
    {
        return new AppValidation({
            uuid: request.header("crnlg-app") || "",
            ip: request.ip || ""
        });
    }

    /**
     * @param [params]
     * @returns {Promise<boolean>}
     */
    async validate(params)
    {
        if (typeof this.ip !== "string" || !this.ip)
        {
            throw new DisplayableApiException("The request came from an invalid IP address.");
        }
        if (typeof this.uuid !== "string" || !this.uuid)
        {
            throw new DisplayableApiException("The request came from an invalid application.");
        }
        this.#app = await ExternalApplicationRepository.findOne({
            uuid: this.uuid
        });
        if (this.app === null)
        {
            throw new DisplayableApiException("The request came from an invalid application.");
        }
        if (["::1", "127.0.0.1", "::ffff:127.0.0.1"].indexOf(this.ip) === -1 && !this.app.hasIp(this.ip))
        {
            throw new DisplayableApiException("You do not have the permission to make this request.");
        }

        return true;
    }
}

module.exports = {
    AppValidation
};