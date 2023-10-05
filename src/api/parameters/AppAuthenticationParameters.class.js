"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { AppAuthentication } = require("../authentication");
const { DisplayableApiException } = require("../../exception/DisplayableApiException.class");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");

class AppAuthenticationParameters extends ApiRouteParameters
{
    static setupAuthentication()
    {
        this.addAuthentication(AppAuthentication);
    }

    /**
     * @returns {AppAuthenticationParameters}
     */
    static parse(request)
    {
        return super.parse(request);
    }

    /**
     * @abstract
     * @returns {Promise<boolean>}
     */
    async validateOwn() { return true; }
}

module.exports = {
    AppAuthenticationParameters
};