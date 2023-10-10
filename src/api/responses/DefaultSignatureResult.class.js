"use strict";
const { ApiResult } = require("./ApiResult.class");

/**
 * @typedef {ApiResultBean} DefaultSignatureResultBean
 * @property {string} result
 */

class DefaultSignatureResult extends ApiResult
{
    /**
     * @type {string}
     */
    result = "";

    /**
     * @param {DefaultSignatureResultBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {DefaultSignatureResultBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {DefaultSignatureResultBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    DefaultSignatureResult
};