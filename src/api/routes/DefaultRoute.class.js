"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { ApiResponse } = require("../responses/ApiResponse.class");

class DefaultRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("get", "/", this.action);

        if (process.env.APP_ENV === "test")
        {
            this.addRoute("get", "/test-error", this.testError);
        }
    }

    /**
     * @returns {ApiResponse}
     */
    static action()
    {
        return new ApiResponse({
            success: true
        });
    }

    static testError()
    {
        throw new Error("Teszt error");
    }
}

module.exports = {
    DefaultRoute
};