"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll } = require("@jest/globals");
const { UsersRoute } = require("../../../src/api/routes/UsersRoute.class");
const { UsersRouteCreateParameters } = require("../../../src/api/parameters/UsersRouteCreateParameters.class");
const { Log } = require("../../../src/model/Log");

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("UsersRoute.test");
});

test("getRoutes", () => {
    let routes = UsersRoute.getRoutes();
    expect(routes).toHaveLength(1);

    let route = routes.shift();
    expect(route.method).toBe("put");
    expect(route.route).toBe("/user");
    expect(typeof route.action).toBe("function");
    expect(route.parameterClass).toBe(UsersRouteCreateParameters);
});