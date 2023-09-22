"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DefaultRoute } = require("../../../src/api/routes");
const { ApiResponse } = require("../../../src/api/responses/ApiResponse.class");

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

test("getRoutes", () => {
    let routes = DefaultRoute.getRoutes();
    expect(routes).toHaveLength(3);

    checkRoute(
        routes[0],
        "get",
        "/",
        new ApiResponse({ success: true })
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

    const env = process.env.APP_ENV;
    process.env.APP_ENV = "dev";

    routes = DefaultRoute.getRoutes();
    expect(routes).toHaveLength(1);

    checkRoute(
        routes[0],
        "get",
        "/",
        new ApiResponse({ success: true })
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

    process.env.APP_ENV = env;
});