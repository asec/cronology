"use strict";
require("../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
require("../../src/utils/Function");
const { ApiRouteParameters } = require("../../src/api/parameters/ApiRouteParameters.class");
const { AppAuthenticationParameters } = require("../../src/api/parameters/AppAuthenticationParameters.class");
const { AppRouteGetAppParameters } = require("../../src/api/parameters/AppRouteGetAppParameters.class");
const { UsersRouteCreateParameters } = require("../../src/api/parameters/UsersRouteCreateParameters.class");

test("isClassExtendedFrom", () => {
    expect(AppRouteGetAppParameters.isClassExtendedFrom(ApiRouteParameters)).toBe(true);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(AppAuthenticationParameters)).toBe(true);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(AppRouteGetAppParameters)).toBe(true);

    expect(AppRouteGetAppParameters.isClassExtendedFrom(Date)).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(Object)).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(new Date())).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(new ApiRouteParameters({}))).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(String)).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(Function)).toBe(false);
    expect(AppRouteGetAppParameters.isClassExtendedFrom(UsersRouteCreateParameters)).toBe(false);
});