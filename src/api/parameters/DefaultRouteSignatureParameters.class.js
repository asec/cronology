"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { DisplayableApiException } = require("../../exception");
const { AppValidation } = require("../authentication");

/**
 * @typedef {ApiRouteParameterBean} DefaultRouteSignatureParametersBean
 * @property {{}} data
 */

class DefaultRouteSignatureParameters extends ApiRouteParameters
{
    static authentication = [
        ...super.authentication,
        AppValidation
    ];

    /**
     * @type {{}}
     */
    data = {};

    /**
     * @returns ExternalApplication
     */
    get app()
    {
        if (!this.authenticators.length)
        {
            throw new DisplayableApiException("You need to populate the authenticators before you can access them.");
        }
        if (!this.authenticators[0].app)
        {
            throw new DisplayableApiException("The app could not be found in the following authenticator: 0.");
        }

        return this.authenticators[0].app;
    }

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
        result.data = {...request.body, ip: request.body.ip || result.authentication.ip};
    }

    async validateOwn()
    {
        return true;
    }
}

module.exports = {
    DefaultRouteSignatureParameters
};