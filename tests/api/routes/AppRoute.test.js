"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppRoute } = require("../../../src/api/routes/AppRoute.class");
const { ApiRouteParameters } = require("../../../src/api/parameters/ApiRouteParameters.class");
const { AppRouteGetAppParameters } = require("../../../src/api/parameters/AppRouteGetAppParameters.class");
const { ApiResult, ApiError } = require("../../../src/api/responses");
const { AppAuthentication } = require("../../../src/api/authentication/AppAuthentication.class");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { Log } = require("../../../src/model/Log");
require("../../../src/utils/Function");
const db = require("../../db");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("AppRoute.test");
    await db.connect();

    app = new ExternalApplication({
        name: "AppRoute-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

/**
 * @param {ApiRouteDescriptor} route
 * @param {string} expectedMethod
 * @param {string} expectedRoute
 * @param {ApiRouteParameters} [params = undefined]
 * @param {ApiResponse} [result = undefined]
 * @param {typeof Error} [toThrow = undefined]
 */
async function checkRoute(
    route,
    expectedMethod,
    expectedRoute,
    params = undefined,
    result = undefined,
    toThrow = undefined
)
{
    expect(route.method).toBe(expectedMethod);
    expect(route.route).toBe(expectedRoute);
    expect(Object.keys(route).indexOf("parameterClass")).toBeGreaterThan(-1);
    expect(route.parameterClass).not.toBe(undefined);
    if (route.parameterClass !== undefined)
    {
        expect(route.parameterClass.isClassExtendedFrom(ApiRouteParameters)).toBe(true);
        expect(params).toBeInstanceOf(route.parameterClass);
    }
    if (toThrow !== undefined)
    {
        await expect(route.action(params)).rejects.toThrow(toThrow);
    }
    else
    {
        expect(await route.action(params)).toStrictEqual(result);
    }
}

test("getRoutes", () => {
    let routes = AppRoute.getRoutes();
    expect(routes).toHaveLength(1);
});

test("route: get /app/:uuid", async () => {
    let routes = AppRoute.getRoutes();
    let route = routes[0];
    let params = new AppRouteGetAppParameters({
        uuid: app.uuid
    });
    let auth = new AppAuthentication();
    auth.ip = "::1";
    params.populateAuthenticator(0, auth);
    await checkRoute(
        route,
        "get",
        "/app/:uuid",
        params,
        new ApiResult({
            success: true,
            result: app.toObject()
        })
    );

    await checkRoute(
        route,
        "get",
        "/app/:uuid",
        new AppRouteGetAppParameters({ uuid: "test" }),
        new ApiError({
            error: "This app doesn't exists. Please check your UUID.",
            displayable: true
        })
    );

    await checkRoute(
        route,
        "get",
        "/app/:uuid",
        new AppRouteGetAppParameters({ uuid: "" }),
        new ApiError({
            error: "This app doesn't exists. Please check your UUID.",
            displayable: true
        })
    );

    await checkRoute(
        route,
        "get",
        "/app/:uuid",
        new AppRouteGetAppParameters({}),
        new ApiError({
            error: "This app doesn't exists. Please check your UUID.",
            displayable: true
        })
    );

    await checkRoute(
        route,
        "get",
        "/app/:uuid",
        new AppRouteGetAppParameters({ uuid: app.uuid }),
        new ApiError({
            error: "You do not have the permission to make this request.",
            displayable: true
        })
    );
});