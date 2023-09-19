"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { DisplayableApiException } = require("../../exception/DisplayableApiException.class");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

/**
 * @typedef {{}} AppAuthenticationBean
 * @property {string} ip
 * @property {string} appUuid
 * @property {string} signature
 */

class AppAuthenticationParameters extends ApiRouteParameters
{
    /**
     * @type {AppAuthenticationBean}
     */
    #authentication = {};
    /**
     * @returns {AppAuthenticationBean}
     */
    get authentication()
    {
        return this.#authentication;
    }

    /**
     * @param {AppAuthenticationBean} params
     */
    setAuthentication(params)
    {
        this.#authentication = {
            ip: params.ip || "",
            appUuid: params.appUuid || "",
            signature: params.signature || ""
        };
    }

    /**
     * @returns {typeof AppAuthenticationParameters}
     */
    static parse(req)
    {
        let result = new this();
        result.setAuthentication({
            ip: req.ip,
            appUuid: req.header("crnlg-app"),
            signature: req.header("crnlg-signature")
        });
        return result;
    }

    /**
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validate()
    {
        if (typeof this.authentication.ip !== "string" || !this.authentication.ip)
        {
            throw new DisplayableApiException("The request came from an invalid IP address.");
        }
        if (typeof this.authentication.appUuid !== "string" || !this.authentication.appUuid)
        {
            throw new DisplayableApiException("The request came from an invalid application.");
        }
        if (typeof this.authentication.signature !== "string" || !this.authentication.signature)
        {
            throw new DisplayableApiException("The request contained an invalid signature.");
        }

        let app = await ExternalApplicationRepository.findOne({
            uuid: this.authentication.appUuid
        });
        if (app === null)
        {
            throw new DisplayableApiException("The request came from an invalid application.");
        }
        if (["::1", "127.0.0.1"].indexOf(this.authentication.ip) === -1 && !app.hasIp(this.authentication.ip))
        {
            throw new DisplayableApiException("You do not have the permission to make this request.");
        }
        if (!await app.validateSignature(this.authentication.signature, this.toObject()))
        {
            throw new DisplayableApiException("You do not have the permission to make this request.");
        }

        return true;
    }

    toObject()
    {
        let result = super.toObject();
        result.ip = this.authentication.ip;
        return result;
    }
}

module.exports = {
    AppAuthenticationParameters
};