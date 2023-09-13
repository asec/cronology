"use strict";
const crypto = require("crypto");
const db = require("../utils/db");

const { ApiRoute } = require("./ApiRoute.class");
const { ApiResponse } = require("./responses/ApiResponse.class");
const { ApiError } = require("./responses/ApiError.class");
const { DefaultRoute, UsersRoute } = require("./routes");
const { ApiRouteParameters } = require("./parameters/ApiRouteParameters.class");

const { Log } = require("../model/Log");

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
        await db.connect();
        this.addAllRoutes();
    }

    /**
     * @protected
     */
    static addAllRoutes()
    {
        this.addRoutes(DefaultRoute);
        this.addRoutes(UsersRoute);
    }

    /**
     * @protected
     * @param {typeof ApiRoute} routeClass
     */
    static addRoutes(routeClass)
    {
        let routes = routeClass.getRoutes();
        for (let i = 0; i < routes.length; i++)
        {
            this.addRoute(routes[i], routeClass);
        }
    }

    /**
     * @protected
     * @param {ApiRouteDescriptor} descriptor
     * @param {typeof ApiRoute} routeClass
     * @throws {Error}
     */
    static addRoute(descriptor, routeClass)
    {
        if (this.hasRoute(descriptor.method, descriptor.route))
        {
            throw new Error("Cannot add route because it already exists: '" + descriptor.method + " " + descriptor.route + "'");
        }

        this.#routes[descriptor.method][descriptor.route] = {
            /**
             * @param {ApiRouteParameters} params
             * @returns {Promise<ApiResponse>}
             * @throws {Error}
             */
            action: async (params) => {
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
                    throw new Error(
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
     * @throws {Error}
     */
    static async executeAction(action, descriptor, params = undefined)
    {
        let apiResponse = await action(params);
        if (!apiResponse || !(apiResponse instanceof ApiResponse))
        {
            throw new Error(
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
     * @throws {Error}
     */
    static async execute(method, route, params = undefined, requestId = undefined)
    {
        requestId = requestId || crypto.randomUUID();
        if (!this.hasRoute(method, route))
        {
            throw new Error("API Execution fail: The given route is invalid: '" + method + " " + route + "'");
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