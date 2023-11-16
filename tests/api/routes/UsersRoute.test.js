"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll } = require("@jest/globals");
const { UsersRoute } = require("../../../src/api/routes/UsersRoute.class");
const { UsersRouteCreateParameters, UsersRouteCreateAccessTokenParameters, UsersRouteGetParameters } = require("../../../src/api/parameters");
const { Log } = require("../../../src/model/Log");

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("UsersRoute.test");
});

test("getRoutes", () => {
    let routes = UsersRoute.getRoutes();
    expect(routes).toHaveLength(3);

    let route = routes.shift();
    expect(route.method).toBe("put");
    expect(route.route).toBe("/user");
    expect(typeof route.action).toBe("function");
    expect(route.parameterClass).toBe(UsersRouteCreateParameters);

    route = routes.shift();
    expect(route.method).toBe("post");
    expect(route.route).toBe("/user/accessToken");
    expect(typeof route.action).toBe("function");
    expect(route.parameterClass).toBe(UsersRouteCreateAccessTokenParameters);

    route = routes.shift();
    expect(route.method).toBe("get");
    expect(route.route).toBe("/user");
    expect(typeof route.action).toBe("function");
    expect(route.parameterClass).toBe(UsersRouteGetParameters);
});