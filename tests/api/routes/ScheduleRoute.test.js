"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ScheduleRoute } = require("../../../src/api/routes/ScheduleRoute.class");
const { ScheduleRouteScheduleParameters } = require("../../../src/api/parameters");

test("getRoutes", () => {
    let routes = ScheduleRoute.getRoutes();
    expect(routes).toHaveLength(1);

    let route = routes.shift();
    expect(route.method).toBe("post");
    expect(route.route).toBe("/schedule");
    expect(typeof route.action).toBe("function");
    expect(route.parameterClass).toBe(ScheduleRouteScheduleParameters);
});