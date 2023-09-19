"use strict";
const { AppAuthenticationParameters } = require("./AppAuthenticationParameters.class");
const { DisplayableApiException } = require("../../exception/DisplayableApiException.class");

/**
 * @typedef {ApiRouteParameterBean} AppRouteGetAppParametersBean
 * @property {string} uuid
 */

class AppRouteGetAppParameters extends AppAuthenticationParameters
{
    /**
     * @type {string}
     */
    uuid = "";

    /**
     * @param {AppRouteGetAppParametersBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {AppRouteGetAppParametersBean} params
     */
    setAll(params)
    {
        super.setAll(params);
    }

    static parse(req)
    {
        /**
         * @type {AppRouteGetAppParameters}
         */
        let result = super.parse(req);
        result.setAll({
            uuid: req.params.uuid
        });
        return result;
    }

    /**
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validate()
    {
        await super.validate();
        if (typeof this.uuid !== "string" || !this.uuid)
        {
            throw new DisplayableApiException("Invalid parameter: 'uuid'. If you wish to use this endpoint, you must" +
                " know the UUID of your app.");
        }

        return true;
    }
}

module.exports = {
    AppRouteGetAppParameters
};