"use strict";

/**
 * @typedef {Object} ApiResponseBean
 * @property {boolean} success
 */

class ApiResponse
{
    /**
     * @type {ApiResponseBean}
     */
    data = {
        success: false
    };

    /**
     * @param {ApiResponseBean} values
     */
    constructor(values)
    {
        this.set(values);
    }

    /**
     * @param {string|ApiResponseBean} key
     * @param {*} [value = undefined]
     * @returns {boolean}
     */
    set(key, value = undefined)
    {
        let success = true;
        if (value === undefined)
        {
            if (!key || typeof key !== "object")
            {
                return false;
            }

            for (let i in key)
            {
                let keyWasSetSuccessfully = this.#set(i, key[i]);
                if (!keyWasSetSuccessfully)
                {
                    success = false;
                }
            }

            return success;
        }

        return this.#set(key, value);
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    #set(key, value)
    {
        if (!this.data.hasOwnProperty(key))
        {
            return false;
        }

        this.data[key] = value;

        return true;
    }

    /**
     * @returns {ApiResponseBean}
     */
    toObject()
    {
        return {...this.data};
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