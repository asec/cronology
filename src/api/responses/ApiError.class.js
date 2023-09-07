"use strict";
const { ApiResponse } = require("./ApiResponse.class");
const {del} = require("express/lib/application");

/**
 * @typedef {ApiResponseBean} ApiErrorBean
 * @property {string} error
 * @property {string} [displayMessage]
 * @property {boolean} [displayable]
 */

class ApiError extends ApiResponse
{
    /**
     * @type {ApiErrorBean}
     */
    data = {
        success: false,
        error: "",
        displayMessage: "An unexpected error occurred while processing your request.",
        displayable: false
    };

    /**
     * @param {ApiErrorBean} values
     */
    constructor(values)
    {
        super(values);
        this.set(values);
    }

    /**
     * @param {string|ApiErrorBean} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value = undefined)
    {
        return super.set(key, value);
    }

    /**
     * @returns {ApiErrorBean}
     */
    toObject()
    {
        /**
         * @type {ApiErrorBean}
         */
        let data = {...this.data};
        let displayable = data.displayable;
        delete data.displayable;
        if (!displayable && process.env.APP_ENV !== "test")
        {
            data.error = data.displayMessage;
            delete data.displayMessage;
        }
        if (displayable)
        {
            delete data.displayMessage;
        }
        return data;
    }
}

module.exports = {
    ApiError
};