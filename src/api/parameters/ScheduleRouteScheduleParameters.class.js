"use strict";
const { ApiRouteParameters } = require("./ApiRouteParameters.class");
const { DisplayableApiException } = require("../../exception");
const { AppValidation, UserValidation } = require("../authentication");

/**
 * @typedef {ApiRouteParameterBean} ScheduleRouteScheduleParametersBean
 * @property {string} schedule
 * @property {number} limit
 */

class ScheduleRouteScheduleParameters extends ApiRouteParameters
{
    static authentication = [
        ...super.authentication,
        AppValidation,
        UserValidation
    ];
    /**
     * @type {string}
     */
    schedule = "";
    /**
     * @type {number}
     */
    limit = 0;

    /**
     * @param {ScheduleRouteScheduleParametersBean} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "ScheduleRouteScheduleParameters")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {ScheduleRouteScheduleParametersBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {ScheduleRouteScheduleParametersBean}
     */
    toObject()
    {
        return super.toObject();
    }

    /**
     * @param request
     * @returns {ScheduleRouteScheduleParameters}
     */
    static parse(request)
    {
        return super.parse(request);
    }

    /**
     * @protected
     * @param request
     * @param {ScheduleRouteScheduleParameters} result
     */
    static parseOwn(request, result)
    {
        result.setAll({
            schedule: request.body.schedule || "",
            limit: Number(request.query.limit) || 0
        });
    }

    /**
     * @protected
     * @returns {Promise<boolean>}
     */
    async validateOwn()
    {
        if (!this.schedule || typeof this.schedule !== "string")
        {
            throw new DisplayableApiException("Invalid parameter: 'schedule'. Must be 'now', a date in" +
                " 'yyyy-mm-dd hh:ii:ss' format or a string in valid simplified cron syntax.");
        }
        let limitMax = 1000;
        if (typeof this.limit !== "number" || isNaN(this.limit) || this.limit < 0 || this.limit > limitMax)
        {
            throw new DisplayableApiException("Invalid parameter: 'limit'. Must be a number between 0 and" +
                " " + limitMax + ".");
        }
        return true;
    }
}

module.exports = {
    ScheduleRouteScheduleParameters
};