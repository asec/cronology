"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { ExternalApplication, ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { AppRouteGetAppParameters } = require("../parameters/AppRouteGetAppParameters.class");
const { ApiResult, ApiError } = require("../responses");

class AppRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("get", "/app/:uuid", this.getAppByUuid, AppRouteGetAppParameters);
    }

    /**
     * @param {AppRouteGetAppParameters} params
     * @returns {ApiResponse}
     */
    static async getAppByUuid(params)
    {
        let app = await ExternalApplicationRepository.findOne({ uuid: params.uuid });
        if (app === null)
        {
            return new ApiError({
                error: "This app doesn't exists. Please check your UUID.",
                displayable: true
            });
        }

        if (["::1", "127.0.0.1"].indexOf(params.authentication.ip) === -1 && !app.hasIp(params.authentication.ip))
        {
            return new ApiError({
                error: "You do not have the permission to make this request.",
                displayable: true
            });
        }

        return new ApiResult({
            success: true,
            result: app.toObject()
        });
    }
}

module.exports = {
    AppRoute
};