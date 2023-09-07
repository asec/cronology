"use strict";
const { Api } = require("./Api.class");
const express = require("express");
const fs = require("fs");
const httpWrapper = require("https");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("../utils/db");

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
        await db.connect();
        const http = this.#createServer();

        http.listen(process.env.CONF_API_PORT, () => {
            Log.log("info", "api", {message: "Server started on " + process.env.CONF_API_PORT});
        });

        Api.init();

        let routes = Api.getRoutes();
        for (let method in routes)
        {
            routes[method].forEach(cRoute => {
                switch (method)
                {
                    case "get":
                        this.#app.get(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
                        break;
                    case "put":
                        this.#app.put(cRoute.route, this.#createAction(method, cRoute.route, cRoute.parameterClass));
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
            await Log.log("info", "api: request", {
                method,
                route,
                request: {
                    baseUrl: req.baseUrl,
                    body: req.body,
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
            /**
             * @type {ApiRouteParameters}
             */
            let params = undefined;
            try
            {
                if (parameterClass)
                {
                    params = parameterClass.parse(req);
                }
            }
            /**
             * @type {Error}
             */
            catch (e)
            {
                let logParams = undefined;
                if (params instanceof ApiRouteParameters)
                {
                    logParams = params.sanitize();
                }
                await Log.log("error", "api", {
                    cause: "Error parsing request data into '" + parameterClass.name + "'",
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
                let apiResponse = new ApiError({
                    error: e.message,
                    displayable: (e.hasOwnProperty("displayable") ? e.displayable : false)
                });
                res.status(500);
                res.json(apiResponse.toObject());
                await Log.log("error", "api: response", {
                    method,
                    route,
                    response: {
                        status: res.statusCode,
                        headers: res.getHeaders(),
                        body: apiResponse.toObject()
                    }
                });
                return;
            }

            let apiResponse = await Api.execute(method, route, params);
            if (apiResponse instanceof ApiError)
            {
                res.status(500);
            }
            res.json(apiResponse.toObject());
            await Log.log(req.statusCode === 500 ? "error" : "info", "api: response", {
                method,
                route,
                response: {
                    status: res.statusCode,
                    headers: res.getHeaders(),
                    body: apiResponse.toObject()
                }
            });
        };

        return result;
    }
}

module.exports = {
    ApiWithExpress
};