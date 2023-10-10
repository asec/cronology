"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { DefaultRouteSignatureParameters } = require("../parameters/DefaultRouteSignatureParameters.class");
const { ApiResponse, PingResponse, DefaultSignatureResult } = require("../responses");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { DisplayableApiException } = require("../../exception");

class DefaultRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("get", "/", this.ping);

        if (process.env.APP_ENV === "test")
        {
            this.addRoute("get", "/test-error", this.testError);
            this.addRoute("get", "/bad-response", this.badResponse);
            this.addRoute("delete", "/", this.truncate);
            this.addRoute("post", "/signature", this.signature, DefaultRouteSignatureParameters);
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

    static async truncate()
    {
        const db = require("../../utils/db");

        await db.truncate();

        return new ApiResponse({
            success: true
        });
    }

    /**
     * @param {DefaultRouteSignatureParameters} params
     * @returns {Promise<DefaultSignatureResult>}
     * @throws {DisplayableApiException}
     */
    static async signature(params)
    {
        let app = await ExternalApplicationRepository.findOne({
            uuid: params.uuid
        });
        if (!app)
        {
            throw new DisplayableApiException("Invalid app uuid.");
        }

        let signature = await app.generateSignature(params.data);

        return new DefaultSignatureResult({
            success: true,
            result: signature
        });
    }
}

module.exports = {
    DefaultRoute
};