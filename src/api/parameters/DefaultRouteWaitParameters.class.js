"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const {DisplayableApiException} = require("../../exception");

/**
 * @typedef {ApiRouteParameterBean} DefaultRouteWaitParametersBean
 * @property {number} ms
 */

class DefaultRouteWaitParameters extends ApiRouteParameters
{
    /**
     * @type {number}
     */
    ms = 1000;

    /**
     * @param {DefaultRouteWaitParametersBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "DefaultRouteWaitParameters")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {DefaultRouteWaitParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {DefaultRouteWaitParametersBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param request
     * @returns {DefaultRouteWaitParameters}
     */
    static parse(request)
    {
        return super.parse(request);
    }

    /**
     * @protected
     * @param request
     * @param {DefaultRouteWaitParameters} result
     */
    static parseOwn(request, result)
    {
        if (request.query.hasOwnProperty("ms"))
        {
            result.ms = Number(request.query.ms);
        }
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     */
    async validateOwn()
    {
        const msMax = 30000;
        if (typeof this.ms !== "number" || isNaN(this.ms) || this.ms < 0 || this.ms > msMax)
        {
            throw new DisplayableApiException("Invalid parameter: 'ms'. Must be a positive number no greater" +
                " than " + msMax + ".");
        }
        return true;
    }
}

module.exports = {
    DefaultRouteWaitParameters
};