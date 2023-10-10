"use strict";
const { AppAuthenticationParameters } = require("./AppAuthenticationParameters.class");
const { DisplayableApiException } = require("../../exception/DisplayableApiException.class");
const express = require("express");

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
        if (this.constructor.name === "AppRouteGetAppParameters")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {AppRouteGetAppParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {AppRouteGetAppParametersBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @returns {AppRouteGetAppParameters}
     */
    static parse(req)
    {
        return super.parse(req);
    }

    /**
     * @protected
     * @param {express.Request} req
     * @param {AppRouteGetAppParameters} r
     */
    static parseOwn(req, r)
    {
        r.setAll({
            uuid: req.params.uuid
        });
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     * @throws {DisplayableApiException}
     */
    async validateOwn()
    {
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