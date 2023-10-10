"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { AppAuthentication } = require("../authentication");
const { DisplayableApiException } = require("../../exception/DisplayableApiException.class");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

class AppAuthenticationParameters extends ApiRouteParameters
{
    static authentication = [
        ...super.authentication,
        AppAuthentication
    ];

    /**
     * @returns {AppAuthenticationParameters}
     */
    static parse(request)
    {
        return super.parse(request);
    }

    /**
     * @abstract
     * @protected
     * @returns {Promise<boolean>}
     */
    async validateOwn() { return true; }
}

module.exports = {
    AppAuthenticationParameters
};