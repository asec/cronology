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
        this.setAll(params);
    }

    /**
     * @param {AppRouteGetAppParametersBean} params
     */
    setAll(params)
    {
        super.setAll(params);
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