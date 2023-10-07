"use strict";
const { Api } = require("./Api.class");
const express = require("express");
const fs = require("fs");
const httpWrapper = require("https");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const { ApiError } = require("./responses/ApiError.class");
const { Log } = require("../model/Log");
const { ApiRouteParameters } = require("./parameters/ApiRouteParameters.class");

class ApiWithExpress
{
    static #app = express();

    static #createServer()
    {
        const app = this.#app;
        const credentials = {
            key: fs.readFileSync(process.env.CONF_API_HTTPS_PRIVATEKEY, 'utf8'),
            cert: fs.readFileSync(process.env.CONF_API_HTTPS_CERTIFICATE, 'utf8')
        };
        const http = httpWrapper.createServer(credentials, app);
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        return http;
    }

    static async init()
    {
        const http = this.#createServer();

        http.listen(process.env.CONF_API_PORT, () => {
            Log.log("info", "api", {message: "Server started on " + process.env.CONF_API_PORT});
        });

        await Api.init();

        let routes = Api.getRoutes();
        for (let method in routes)
        {
            routes[method].forEach(cRoute => {
                switch (method)
                {
                    case "get":
                        this.#app.get(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
                        break;
                    case "post":
                        this.#app.post(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
                        break;
                    case "put":
                        this.#app.put(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
                        break;
                    case "delete":
                        this.#app.delete(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
                        break;
                }
            });
        }
    }

    /**
     * @param {string} method
     * @param {string} route
     * @param {typeof ApiRouteParameters} [parameterClass]
     * @returns {function(express.Request, express.Response): Promise<void>}
     */
    static #createAction(method, route, parameterClass = undefined)
    {
        /**
         * @param {express.Request} req
         * @param {express.Response} res
         * @returns {Promise<void>}
         */
        let result = async (req, res) => {
            let requestId = crypto.randomUUID();
            await this.#logRequestStart(requestId, method, route, req);
            /**
             * @type {ApiRouteParameters}
             */
            let params = undefined;
            try
            {
                if (parameterClass)
                {
                    params = parameterClass.parse(req);
                    await params.validate();
                }
            }
            /**
             * @type {Error}
             */
            catch (e)
            {
                await this.#logError(
                    requestId, "Error parsing request data into '" + parameterClass.name + "'",
                    method, route, params, e
                );
                let apiResponse = new ApiError({
                    error: e.message,
                    displayable: (e.hasOwnProperty("displayable") ? e.displayable : false)
                });
                res.status(500);
                res.json(apiResponse.toObject());
                await this.#logRequestEnds(requestId, method, route, res, apiResponse);
                return;
            }

            let apiResponse = await Api.execute(method, route, params, requestId);
            if (apiResponse instanceof ApiError)
            {
                res.status(500);
            }
            res.json(apiResponse.toObject());
            await this.#logRequestEnds(requestId, method, route, res, apiResponse);
        };

        return result;
    }

    /**
     * @param {string} requestId
     * @param {string} method
     * @param {string} route
     * @param {express.Request} req
     * @returns {Promise<false|Log>}
     */
    static async #logRequestStart(requestId, method, route, req)
    {
        let body = {...req.body};
        if (body.hasOwnProperty("password"))
        {
            body.password = "********";
        }
        return Log.log("info", "api: request", {
            id: requestId,
            method,
            route,
            request: {
                baseUrl: req.baseUrl,
                body,
                params: req.params,
                hostname: req.hostname,
                ip: req.ip,
                ips: req.ips,
                method: req.method,
                originalUrl: req.originalUrl,
                protocol: req.protocol,
                query: req.query,
                secure: req.secure,
                subdomains: req.subdomains,
                headers: req.headers
            }
        });
    }

    /**
     * @param {string} requestId
     * @param {string} method
     * @param {string} route
     * @param {express.Response} res
     * @param {ApiResponse} apiResponse
     * @returns {Promise<false|Log>}
     */
    static async #logRequestEnds(requestId, method, route, res, apiResponse)
    {
        return Log.log(res.statusCode === 500 ? "error" : "info", "api: response", {
            id: requestId,
            method,
            route,
            response: {
                status: res.statusCode,
                headers: res.getHeaders(),
                body: apiResponse.toObject()
            }
        });
    }

    /**
     * @param {string} requestId
     * @param {string} cause
     * @param {string} method
     * @param {string} route
     * @param {ApiRouteParameters} params
     * @param {Error} e
     * @returns {Promise<false|Log>}
     */
    static async #logError(requestId, cause, method, route, params, e)
    {
        let logParams = undefined;
        if (params instanceof ApiRouteParameters)
        {
            logParams = params.sanitize();
        }
        return Log.log("error", "api", {
            id: requestId,
            cause,
            route: {
                method,
                route,
                params: logParams
            },
            error: {
                code: e.code,
                message: e.message,
                cause: e.cause,
                stack: e.stack
            }
        });
    }
}

module.exports = {
    ApiWithExpress
};