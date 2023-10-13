"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { ScheduleRouteScheduleParameters } = require("../parameters");
const { ScheduleRouteScheduleResult } = require("../responses");
const {ScheduleResolver} = require("../../utils/ScheduleResolver");
const {DisplayableApiException} = require("../../exception");

class ScheduleRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("post", "/schedule", this.schedule, ScheduleRouteScheduleParameters);
    }

    /**
     * @param {ScheduleRouteScheduleParameters} params
     * @returns {ScheduleRouteScheduleResult}
     */
    static schedule(params)
    {
        const now = new Date();
        const resolver = new ScheduleResolver(params.schedule, now);
        let next = resolver.next();
        if (next === null)
        {
            throw new DisplayableApiException("Invalid parameter: 'schedule'. Must be 'now', a date in" +
                " 'yyyy-mm-dd hh:ii:ss' format or a string in valid simplified cron syntax.");
        }

        let limit = params.limit;
        if (!limit)
        {
            limit = 1;
        }
        let nextItems = [
            next
        ];
        if (resolver.isRepeatable)
        {
            for (let i = 1; i < limit; i++)
            {
                nextItems.push(resolver.next());
            }
        }

        return new ScheduleRouteScheduleResult({
            success: true,
            now,
            next: nextItems
        });
    }
}

module.exports = {
    ScheduleRoute
};