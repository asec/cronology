"use strict";
const { ApiResponse } = require("./ApiResponse.class");

/**
 * @typedef {ApiResponseBean} ApiResultBean
 * @property {any} result
 */

class ApiResult extends ApiResponse
{
    /**
     * @type {any}
     */
    result = null;

    /**
     * @param {ApiResultBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {ApiResultBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {ApiResponseBean}
     */
    toObject()
    {
        let data = super.toObject();

        if (data.result && data.result.hasOwnProperty("_id"))
        {
            data.result = this.sanitizeDbObject(data.result);
            delete data.result.password;
        }

        return data;
    }
}

module.exports = {
    ApiResult
};