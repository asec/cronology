"use strict";
const { test, expect, beforeEach, afterAll } = require("@jest/globals");

const defaultEnvironmentVariables = {...process.env};
beforeEach(() => {
    jest.resetModules();
    process.env = {...defaultEnvironmentVariables};
});

afterAll(() => {
    process.env = defaultEnvironmentVariables;
});

test.each([
    "dev",
    "test"
])("Environment: %s", (env) => {
    expect(process.env.APP_ENV).toBeUndefined();
    require("../config/dotenv").environment(env);
    expect(process.env.APP_ENV).toBe(env);
    expect(process.env.CONF_API_HTTPS_PRIVATEKEY).toBeDefined();
    expect(process.env.CONF_API_HTTPS_PRIVATEKEY).not.toBe("");
    expect(process.env.CONF_API_PORT).toBeDefined();
    expect(process.env.CONF_API_PORT).not.toBe("");
});