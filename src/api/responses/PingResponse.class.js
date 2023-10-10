"use strict";
const { ApiResponse } = require("./ApiResponse.class");

/**
 * @typedef {ApiResponseBean} PingResponseBean
 * @property {string} version
 */

class PingResponse extends ApiResponse
{
    /**
     * @type {string}
     */
    version = "";

    /**
     * @param {PingResponseBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "PingResponse")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {PingResponseBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {PingResponseBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    PingResponse
};