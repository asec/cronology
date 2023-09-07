"use strict";
require("../../config/dotenv").environment("test");
const { test, expect, beforeEach } = require("@jest/globals");
const { Api } = require("../../src/api/Api.class");
const { ApiError } = require("../../src/api/responses/ApiError.class");

beforeEach(() => {
    Api.init();
});

test("execute: DefaultRoute", async () => {
    let response = await Api.execute("get", "/");
    expect(response.toObject()).toStrictEqual({ success: true });

    response = await Api.execute("get", "/test-error");
    expect(response).toBeInstanceOf(ApiError);

    await expect(Api.execute("get2", "/")).rejects.toThrow(Error);
    await expect(Api.execute("get", "/2")).rejects.toThrow(Error);
});

test("execute: UsersRoute", async () => {
    const { UsersRouteCreateParameters } = require("../../src/api/parameters/UsersRouteCreateParameters.class");

    let response = await Api.execute("put", "/user", new UsersRouteCreateParameters({
        username: "a",
        password: "b"
    }));
    console.log(response);
});