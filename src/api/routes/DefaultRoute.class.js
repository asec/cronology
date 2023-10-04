"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { ApiResponse, PingResponse } = require("../responses");

class DefaultRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("get", "/", this.ping);

        if (process.env.APP_ENV === "test")
        {
            this.addRoute("get", "/test-error", this.testError);
            this.addRoute("get", "/bad-response", this.badResponse);
        }
    }

    /**
     * @returns {PingResponse}
     */
    static ping()
    {
        const packageInfo = require("../../../package.json");
        let version = packageInfo.version;
        if (process.env.APP_ENV !== "prod")
        {
            version += " (" + process.env.APP_ENV + ")";
        }
        return new PingResponse({
            success: true,
            version
        });
    }

    static testError()
    {
        throw new Error("Teszt error");
    }

    static badResponse()
    {

    }
}

module.exports = {
    DefaultRoute
};