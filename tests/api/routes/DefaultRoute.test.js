"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DefaultRoute } = require("../../../src/api/routes");
const { ApiResponse, PingResponse } = require("../../../src/api/responses");
const { ApiRouteParameters } = require("../../../src/api/parameters/ApiRouteParameters.class");
const packageInfo = require("../../../package.json");
const {UsersRouteCreateParameters} = require("../../../src/api/parameters/UsersRouteCreateParameters.class");

/**
 * @param {ApiRouteDescriptor} route
 * @param {string} expectedMethod
 * @param {string} expectedRoute
 * @param {ApiResponse} [result = undefined]
 * @param {typeof Error} [toThrow = undefined]
 */
function checkRoute(route, expectedMethod, expectedRoute, result = undefined, toThrow = undefined)
{
    expect(route.method).toBe(expectedMethod);
    expect(route.route).toBe(expectedRoute);
    expect(Object.keys(route).indexOf("parameterClass")).toBeGreaterThan(-1);
    expect(route.parameterClass).toBe(undefined);
    if (toThrow !== undefined)
    {
        expect(() => route.action()).toThrow(toThrow);
    }
    else
    {
        expect(route.action()).toStrictEqual(result);
    }
}

/**
 * @param {ApiRouteDescriptor} routeData
 * @param {string} method
 * @param {string} route
 * @param {typeof ApiRouteParameters} [parameterClass]
 */
function checkRouteFormat(routeData, method, route, parameterClass = undefined)
{
    expect(routeData.method).toBe(method);
    expect(routeData.route).toBe(route);
    expect(typeof routeData.action).toBe("function");
    if (parameterClass)
    {
        expect(routeData.parameterClass.isClassExtendedFrom(ApiRouteParameters)).toBe(true);
        expect(routeData.parameterClass).toBe(parameterClass);
    }
}

test("getRoutes", () => {
    const packageInfo = require("../../../package.json");
    let routes = DefaultRoute.getRoutes();
    expect(routes).toHaveLength(5);

    checkRoute(
        routes[0],
        "get",
        "/",
        new PingResponse({ success: true, version: packageInfo.version + " (test)" })
    );

    checkRoute(
        routes[1],
        "get",
        "/test-error",
        undefined,
        Error
    );

    checkRoute(
        routes[2],
        "get",
        "/bad-response",
        undefined
    );

    checkRouteFormat(
        routes[3],
        "delete",
        "/"
    );

    const env = process.env.APP_ENV;
    process.env.APP_ENV = "dev";

    routes = DefaultRoute.getRoutes();
    expect(routes).toHaveLength(1);

    checkRoute(
        routes[0],
        "get",
        "/",
        new PingResponse({ success: true, version: packageInfo.version + " (dev)" })
    );

    expect(() => checkRoute(
        routes[1],
        "get",
        "/test-error",
        null,
        Error
    )).toThrow(Error);

    expect(() => checkRoute(
        routes[2],
        "get",
        "/bad-response",
        undefined
    )).toThrow(Error);

    expect(() => checkRoute(
        routes[3],
        "delete",
        "/",
        undefined
    )).toThrow(Error);

    process.env.APP_ENV = "prod";
    checkRoute(
        routes[0],
        "get",
        "/",
        new PingResponse({ success: true, version: packageInfo.version })
    );

    expect(() => checkRoute(
        routes[3],
        "delete",
        "/",
        undefined
    )).toThrow(Error);

    process.env.APP_ENV = env;
});