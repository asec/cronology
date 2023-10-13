"use strict";
const { ApiResponse } = require("./ApiResponse.class");
const { ApiException } = require("../../exception");

/**
 * @typedef {ApiResponseBean} ScheduleRouteScheduleResultBean
 * @property {Date} now
 * @property {Date[]} [next]
 */

class ScheduleRouteScheduleResult extends ApiResponse
{
    /**
     * @type {Date}
     */
    now = null;
    /**
     * @type {Date[]}
     */
    next = [];

    /**
     * @param {ScheduleRouteScheduleResultBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "ScheduleRouteScheduleResult")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {ScheduleRouteScheduleResultBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {ScheduleRouteScheduleResultBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     * @throws {ApiException}
     */
    set(key, value)
    {
        if (key === "next")
        {
            const keyNextError = "Invalid response key: 'next'. Must be an array of Dates.";
            if (!Array.isArray(value))
            {
                throw new ApiException(keyNextError);
            }
            for (let i = 0; i < value.length; i++)
            {
                if (!(value[i] instanceof Date))
                {
                    throw new ApiException(keyNextError);
                }
            }
        }
        return super.set(key, value);
    }
}

module.exports = {
    ScheduleRouteScheduleResult
};