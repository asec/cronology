"use strict";
const { ApiAuthenticationBase } = require("./ApiAuthenticationBase.class");
const { DisplayableApiException } = require("../../exception");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

/**
 * @typedef {BeanObject} AppAuthenticationBean
 * @property {string} [ip]
 * @property {string} [uuid]
 * @property {string} [signature]
 */

class AppAuthentication extends ApiAuthenticationBase
{
    ip = "";
    uuid = "";
    signature = "";

    /**
     * @param {AppAuthenticationBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "AppAuthentication")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {AppAuthenticationBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {AppAuthentication}
     */
    static parse(request)
    {
        let result = new AppAuthentication();
        result.ip = request.ip || "";
        result.uuid = request.header("crnlg-app") || "";
        result.signature = request.header("crnlg-signature") || "";

        return result;
    }

    /**
     * @throws {DisplayableApiException}
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
        if (typeof this.signature !== "string" || !this.signature)
        {
            throw new DisplayableApiException("The request contained an invalid signature.");
        }

        let app = await ExternalApplicationRepository.findOne({
            uuid: this.uuid
        });
        if (app === null)
        {
            throw new DisplayableApiException("The request came from an invalid application.");
        }
        if (["::1", "127.0.0.1", "::ffff:127.0.0.1"].indexOf(this.ip) === -1 && !app.hasIp(this.ip))
        {
            throw new DisplayableApiException("You do not have the permission to make this request.");
        }
        let signatureParams = {...params, ip: this.ip};
        if (!await app.validateSignature(this.signature, signatureParams))
        {
            throw new DisplayableApiException("You do not have the permission to make this request.");
        }

        return true;
    }

    /**
     * @returns {AppAuthenticationBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    AppAuthentication
};