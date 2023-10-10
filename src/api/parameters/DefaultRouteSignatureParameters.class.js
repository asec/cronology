"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { DisplayableApiException } = require("../../exception");

/**
 * @typedef {ApiRouteParameterBean} DefaultRouteSignatureParametersBean
 * @property {string} uuid
 * @property {{}} data
 */

class DefaultRouteSignatureParameters extends ApiRouteParameters
{
    /**
     * @type {string}
     */
    uuid = "";
    /**
     * @type {{}}
     */
    data = {};

    /**
     * @param {DefaultRouteSignatureParametersBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "DefaultRouteSignatureParameters")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {DefaultRouteSignatureParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {DefaultRouteSignatureParametersBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @protected
     * @param request
     * @param {DefaultRouteSignatureParameters} result
     */
    static parseOwn(request, result)
    {
        result.uuid = request.header("crnlg-app") || "";
        result.data = {...request.body, ip: request.body.ip || request.ip};
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validateOwn()
    {
        if (!this.uuid || typeof this.uuid !== "string")
        {
            throw new DisplayableApiException("Invalid app uuid.");
        }
        return true;
    }
}

module.exports = {
    DefaultRouteSignatureParameters
};