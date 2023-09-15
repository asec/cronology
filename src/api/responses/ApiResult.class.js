"use strict";
const { ApiResponse } = require("./ApiResponse.class");

/**
 * @typedef {ApiResponseBean} ApiResultBean
 * @property {any} result
 */

class ApiResult extends ApiResponse
{
    /**
     * @type {ApiResultBean}
     */
    data = {
        success: false,
        result: null
    };

    /**
     * @param {ApiResultBean} values
     */
    constructor(values)
    {
        super(values);
        this.set(values);
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