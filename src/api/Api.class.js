"use strict";
const crypto = require("crypto");

const { ApiRoute } = require("./ApiRoute.class");
const { ApiResponse } = require("./responses/ApiResponse.class");
const { ApiError } = require("./responses/ApiError.class");
const { ApiRouteParameters } = require("./parameters/ApiRouteParameters.class");

const { Log } = require("../model/Log");
const { LoggedException } = require("../exception");

class Api
{
    /**
     * @type {Object.<MethodValueSet, Object<string, {action: function, parameterClass: typeof ApiRouteParameters}>>}
     */
    static #routes = {
        get: {},
        post: {},
        put: {},
        delete: {}
    };

    static async init()
    {
        await Log.startSection("api starts");
        await this.addAllRoutes();
    }

    /**
     * @protected
     */
    static async addAllRoutes()
    {
        /**
         * @type {Object.<string, ApiRoute>}
         */
        const apiRoutes = require("./routes");
        for (let routeClass in apiRoutes)
        {
            await this.addRoutes(apiRoutes[routeClass]);
        }
    }

    /**
     * @protected
     * @param {typeof ApiRoute} routeClass
     */
    static async addRoutes(routeClass)
    {
        let routes = routeClass.getRoutes();
        for (let i = 0; i < routes.length; i++)
        {
            await this.addRoute(routes[i], routeClass);
        }
    }

    /**
     * @protected
     * @param {ApiRouteDescriptor} descriptor
     * @param {typeof ApiRoute} routeClass
     * @throws {LoggedException}
     */
    static async addRoute(descriptor, routeClass)
    {
        await Log.log("info", "api", {
            message: "adding route: '" + descriptor.method + " " + descriptor.route + "'",
            data: {
                className: routeClass.name,
                method: descriptor.method,
                route: descriptor.route,
                parameterClass: descriptor.parameterClass ? descriptor.parameterClass.name : "",
                action: descriptor.action.name
            }
        });
        if (this.hasRoute(descriptor.method, descriptor.route))
        {
            throw new LoggedException("Cannot add route because it already exists:" +
                " '" + descriptor.method + " " + descriptor.route + "'");
        }

        this.#routes[descriptor.method][descriptor.route] = {
            /**
             * @param {ApiRouteParameters} params
             * @returns {Promise<ApiResponse>}
             * @throws {LoggedException}
             */
            action: async (params) => {
                await Log.log("info", "api", {
                    message: "executing action",
                    data: {
                        method: descriptor.method,
                        route: descriptor.route,
                        parameterClass: descriptor.parameterClass ? descriptor.parameterClass.name : "",
                        action: descriptor.action.name,
                        params: params ? params.toObject() : {}
                    }
                });
                if (descriptor.parameterClass && !(params instanceof descriptor.parameterClass))
                {
                    let gotClassName = "";
                    if (typeof params === "function")
                    {
                        gotClassName = params.name;
                    }
                    else if (typeof params === "object" && params)
                    {
                        gotClassName = params.constructor.name;
                    }
                    else
                    {
                        gotClassName = params;
                    }
                    throw new LoggedException(
                        "Invalid parameters type for route: '" + descriptor.method + " " + descriptor.route + "'." +
                        " Needs: " + descriptor.parameterClass.name + ", got: " + gotClassName + "."
                    );
                }
                return await this.executeAction(descriptor.action.bind(routeClass), descriptor, params);
            },
            parameterClass: descriptor.parameterClass
        };
    }

    /**
     * @protected
     * @param {function(params: ApiRouteParameters): ApiResponse} action
     * @param {ApiRouteDescriptor} descriptor
     * @param {ApiRouteParameters} params
     * @returns {Promise<ApiResponse>}
     * @throws {LoggedException}
     */
    static async executeAction(action, descriptor, params = undefined)
    {
        let apiResponse = await action(params);
        if (!apiResponse || !(apiResponse instanceof ApiResponse))
        {
            throw new LoggedException(
                "The API returned an invalid response for route: '" + descriptor.method +
                " " + descriptor.route + "'."
            );
        }

        return apiResponse;
    }

    /**
     * @param {string} method
     * @param {string} route
     * @returns {boolean}
     */
    static hasRoute(method, route)
    {
        if (Object.keys(this.#routes).indexOf(method) === -1)
        {
            return false
        }

        if (Object.keys(this.#routes[method]).indexOf(route) === -1)
        {
            return false;
        }

        return true;
    }

    /**
     * @param {string} method
     * @param {string} route
     * @param {ApiRouteParameters} [params]
     * @param {string} [requestId]
     * @returns {Promise<ApiResponse>}
     * @throws {LoggedException}
     */
    static async execute(method, route, params = undefined, requestId = undefined)
    {
        requestId = requestId || crypto.randomUUID();
        if (!this.hasRoute(method, route))
        {
            throw new LoggedException("API Execution fail: The given route is invalid: '" + method + " " + route + "'");
        }

        /**
         * @type {ApiResponse}
         */
        let apiResponse;
        try
        {
            apiResponse = await this.#routes[method][route].action(params);
        }
        /**
         * @type {Error}
         */
        catch (e)
        {
            await this.#logError(
                requestId, "Error in action handler on route '" + method + " " + route + "'",
                method, route, params, e
            );
            apiResponse = new ApiError({
                error: e.message,
                displayable: (e.hasOwnProperty("displayable") ? e.displayable : false)
            });
        }

        return apiResponse;
    }

    /**
     * @returns {Object.<MethodValueSet, {route: string, parameterClass: typeof ApiRouteParameters}[]>}
     */
    static getRoutes()
    {
        let routes = {};
        for (let method in this.#routes)
        {
            routes[method] = [];
            for (let route in this.#routes[method])
            {
                routes[method].push({
                    route,
                    parameterClass: this.#routes[method][route].parameterClass
                });
            }
        }

        return routes;
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
    Api
};