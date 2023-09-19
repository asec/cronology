"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DefaultRoute } = require("../../../src/api/routes");
const { ApiResponse } = require("../../../src/api/responses/ApiResponse.class");

/**
 * @param {ApiRouteDescriptor} route
 * @param {string} expectedMethod
 * @param {string} expectedRoute
 * @param {ApiResponse} [result = null]
 * @param {typeof Error} [toThrow = null]
 */
function checkRoute(route, expectedMethod, expectedRoute, result = null, toThrow = null)
{
    expect(route.method).toBe(expectedMethod);
    expect(route.route).toBe(expectedRoute);
    if (toThrow !== null)
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
        null,
        Error
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

    process.env.APP_ENV = env;
});