"use strict";
const { ApiResponse } = require("./responses/ApiResponse.class");

/**
 * @typedef {"get"|"post"|"put"|"delete"} MethodValueSet
 */

/**
 * @typedef {Object} ApiRouteDescriptor
 * @property {string} route
 * @property {MethodValueSet} method
 * @property {function(params?: ApiRouteParameters): ApiResponse} action
 * @property {typeof ApiRouteParameters} [parameterClass]
 */

class ApiRoute
{
    /**
     * @type {ApiRouteDescriptor[]}
     */
    static routes = [];

    static resetRoutes()
    {
        this.routes = [];
    }

    /**
     * @returns {ApiRouteDescriptor[]}
     */
    static getRoutes()
    {
        this.resetRoutes();
        this.getRoutesContent();
        return this.routes;
    }

    /**
     * @abstract
     */
    static getRoutesContent() {}

    /**
     * @param {MethodValueSet} method
     * @param {string} route
     * @param {function(params?: ApiRouteParameters): ApiResponse} action
     * @param {typeof ApiRouteParameters} [parameterClass]
     */
    static addRoute(method, route, action, parameterClass = undefined)
    {
        this.routes.push({
            method,
            route,
            action,
            parameterClass
        });
    }
}

module.exports = {
    ApiRoute
};