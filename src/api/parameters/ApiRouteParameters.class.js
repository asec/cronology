"use strict";
const express = require("express");

/**
 * @typedef {{}} ApiRouteParameterBean
 */

class ApiRouteParameters
{
    /**
     * @param {ApiRouteParameterBean} params
     */
    constructor(params)
    {
        this.setAll(params);
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value)
    {
        if (!this.hasOwnProperty(key))
        {
            return false;
        }

        this[key] = value;

        return true;
    }

    /**
     * @param {ApiRouteParameterBean} params
     */
    setAll(params)
    {
        for (let i in params)
        {
            this.set(i, params[i]);
        }
    }

    /**
     * @abstract
     * @param {express.Request} request
     * @returns {ApiRouteParameters}
     */
    static parse(request) {}

    /**
     * @abstract
     * @returns {Promise<boolean>}
     * @throws {Error}
     */
    async validate() {}

    sanitize()
    {
        if (this.hasOwnProperty("password"))
        {
            this.password = "********";
        }

        return this;
    }

    /**
     * @returns {{}}
     */
    toObject()
    {
        return {...this};
    }
}

module.exports = {
    ApiRouteParameters
};