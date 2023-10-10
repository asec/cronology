"use strict";
const { Bean } = require("../datastructures/Bean.class");

/**
 * @typedef {BeanObject} ApiResponseBean
 * @property {boolean} success
 */

class ApiResponse extends Bean
{
    /**
     * @type {boolean}
     */
    success = false;

    /**
     * @param {ApiResponseBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "ApiResponse")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {ApiResponseBean} params
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
        return super.toObject();
    }

    /**
     * @param {Object} object
     * @returns {{}}
     */
    sanitizeDbObject(object)
    {
        let result = {...object};
        let keys = Object.keys(result);
        if (keys.indexOf("_id") > -1)
        {
            result.id = String(object._id);
        }
        delete result._id;
        delete result.__v;

        return result;
    }
}

module.exports = {
    ApiResponse
};