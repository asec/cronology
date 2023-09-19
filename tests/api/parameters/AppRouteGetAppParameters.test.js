"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { AppRouteGetAppParameters } = require("../../../src/api/parameters/AppRouteGetAppParameters.class");

test("constructor", () => {
    let params = new AppRouteGetAppParameters({});
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ uuid: "", ip: undefined });

    params = new AppRouteGetAppParameters({
        uuid: "aaa"
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ uuid: "aaa", ip: undefined });

    params = new AppRouteGetAppParameters({
        uuid: 12
    });
    expect(params.toObject()).toStrictEqual({ uuid: 12, ip: undefined });
});