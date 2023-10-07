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
     * @type {string}
     */
    error = "";
    /**
     * @type {string}
     */
    displayMessage = "An unexpected error occurred while processing your request.";
    /**
     * @type {boolean}
     */
    displayable = false;

    /**
     * @param {ApiErrorBean} params
     */
    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    /**
     * @param {ApiErrorBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {ApiErrorBean}
     */
    toObject()
    {
        /**
         * @type {ApiErrorBean}
         */
        let data = super.toObject();
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