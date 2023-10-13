"use strict";
const { AppValidation } = require("./AppValidation.class");
const { DisplayableApiException } = require("../../exception");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

/**
 * @typedef {AppValidationBean} AppAuthenticationBean
 * @property {string} [signature]
 */

class AppAuthentication extends AppValidation
{
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
        let parent = super.parse(request);
        return new AppAuthentication({
            ...parent.toObject(),
            signature: request.header("crnlg-signature") || ""
        });
    }

    /**
     * @throws {DisplayableApiException}
     */
    async validate(params)
    {
        await super.validate(params);
        if (typeof this.signature !== "string" || !this.signature)
        {
            throw new DisplayableApiException("The request contained an invalid signature.");
        }

        let signatureParams = {...params, ip: this.ip};
        if (!await this.app.validateSignature(this.signature, signatureParams))
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