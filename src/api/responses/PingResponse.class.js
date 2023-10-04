"use strict";
const { ApiResponse } = require("./ApiResponse.class");

/**
 * @typedef {ApiResponseBean} PingResponseBean
 * @property {string} version
 */

class PingResponse extends ApiResponse
{
    /**
     * @type {PingResponseBean}
     */
    data = {
        success: false,
        version: ""
    };

    /**
     * @param {PingResponseBean} values
     */
    constructor(values)
    {
        super(values);
        this.set(values);
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