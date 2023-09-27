"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const db = require("../db");
const { Api } = require("../../src/api/Api.class");
const { ApiError, ApiResult } = require("../../src/api/responses");
const { Log } = require("../../src/model/Log");

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("test-Api.test");
    await db.connect();
    await Api.init();
});

afterAll(async () => {
    await db.tearDown();
});

test("init", async () => {
    await expect(Api.init()).rejects.toThrow();
});

test("getRoutes", () => {
    let routes = Api.getRoutes();
    expect(routes.get).toHaveLength(4);
    expect(routes.post).toHaveLength(0);
    expect(routes.put).toHaveLength(1);
    expect(routes.delete).toHaveLength(0);
});

test("execute: DefaultRoute", async () => {
    let response = await Api.execute("get", "/");
    expect(response.toObject()).toStrictEqual({ success: true });

    response = await Api.execute("get", "/test-error");
    expect(response).toBeInstanceOf(ApiError);

    await expect(Api.execute("get2", "/")).rejects.toThrow(Error);
    await expect(Api.execute("get", "/2")).rejects.toThrow(Error);

    response = await Api.execute("get", "/bad-response");
    expect(response).toBeInstanceOf(ApiError);
});

test("execute: AppRoute::getAppByUuid", async () => {
    const { AppRouteGetAppParameters } = require("../../src/api/parameters/AppRouteGetAppParameters.class");
    const { ExternalApplication } = require("../../src/model/ExternalApplication");

    let app = new ExternalApplication({
        name: "Api-test"
    });
    let params = new AppRouteGetAppParameters({
       uuid: app.uuid
    });

    /**
     * @param {AppRouteGetAppParameters} params
     * @param {string} errorMsgLike
     */
    async function executeAndExpectError(params, errorMsgLike = undefined)
    {
        let response = await Api.execute("get", "/app/:uuid", params);
        expect(response).toBeInstanceOf(ApiError);

        /**
         * @type {ApiErrorBean}
         */
        let responseObject = response.toObject();
        expect(responseObject.success).toBe(false);
        if (errorMsgLike)
        {
            expect(responseObject.error).toMatch(errorMsgLike);
        }
    }

    /**
     * @param {AppRouteGetAppParameters} params
     */
    async function executeAndExpectSuccess(params)
    {
        let response = await Api.execute("get", "/app/:uuid", params);
        /**
         * @type {ApiResultBean}
         */
        let responseObject = response.toObject();
        expect(response).toBeInstanceOf(ApiResult);
        expect(responseObject.success).toBe(true);
        expect(responseObject.result).toStrictEqual(response.toObject().result);
        expect(responseObject.result._id).toBeUndefined();
        expect(responseObject.result.__v).toBeUndefined();
        expect(responseObject.result.id).not.toBeUndefined();
        expect(responseObject.result.password).toBeUndefined();
        expect(responseObject.result.uuid).toBe(params.uuid);
    }

    await executeAndExpectError(params, "UUID");

    await app.save();
    await executeAndExpectError(params, "permission");

    params.setAuthentication({
        ip: "::2"
    });
    await executeAndExpectError(params, "permission");

    app.addIp("::2");
    await app.save();
    await executeAndExpectSuccess(params);

    params.setAuthentication({
        appUuid: app.uuid
    });
    await executeAndExpectError(params, "permission");

    params.setAuthentication({
        ip: "::1",
        appUuid: app.uuid
    });
    await executeAndExpectSuccess(params);

    params = new AppRouteGetAppParameters({});
    await executeAndExpectError(params, "UUID");

    params = new AppRouteGetAppParameters({
        uuid: 12
    });
    await executeAndExpectError(params, "UUID");

    params = new AppRouteGetAppParameters({
        uuid: null
    });
    await executeAndExpectError(params, "UUID");

    params = new AppRouteGetAppParameters({
        uuid: undefined
    });
    await executeAndExpectError(params, "UUID");

    params = new AppRouteGetAppParameters({
        uuid: new Date()
    });
    await executeAndExpectError(params, "UUID");

    params = new AppRouteGetAppParameters({
        uuid: Date
    });
    await executeAndExpectError(params, "UUID");
});

test("execute: UsersRoute::createUser", async () => {
    const { UsersRouteCreateParameters } = require("../../src/api/parameters/UsersRouteCreateParameters.class");
    const { UsersCreateUser } = require("../../src/api/responses");
    let params = new UsersRouteCreateParameters({
        username: 12
    });

    /**
     * @param {UsersRouteCreateParameters} params
     * @param {string} errorMsgLike
     */
    async function executeAndExpectError(params, errorMsgLike = undefined)
    {
        let response = await Api.execute("put", "/user", params);
        expect(response).toBeInstanceOf(ApiError);

        /**
         * @type {ApiErrorBean}
         */
        let responseObject = response.toObject();
        expect(responseObject.success).toBe(false);
        if (errorMsgLike)
        {
            expect(responseObject.error).toMatch(errorMsgLike);
        }
    }

    /**
     * @param {UsersRouteCreateParameters} params
     */
    async function executeAndExpectSuccess(params)
    {
        let response = await Api.execute("put", "/user", params);
        /**
         * @type {UsersCreateUserBean}
         */
        let responseObject = response.toObject();
        expect(response).toBeInstanceOf(UsersCreateUser);
        expect(responseObject.success).toBe(true);
        expect(responseObject.result).toStrictEqual(response.toObject().result);
        expect(responseObject.result._id).toBeUndefined();
        expect(responseObject.result.__v).toBeUndefined();
        expect(responseObject.result.id).not.toBeUndefined();
        expect(responseObject.result.password).toBeUndefined();
        expect(responseObject.result.username).toBe(params.username);
    }

    await executeAndExpectError(undefined);

    await executeAndExpectError(executeAndExpectError);

    await executeAndExpectError(new Date());

    await executeAndExpectError(params, "password");

    params.set("username", null);
    await executeAndExpectError(params, "username");

    params.set("username", new Date());
    await executeAndExpectError(params, "password");

    params.set("username", undefined);
    await executeAndExpectError(params, "username");

    params.set("username", {});
    await executeAndExpectError(params, "username");

    params.set("username", "");
    await executeAndExpectError(params, "username");

    params.set("username", "a");
    await executeAndExpectError(params, "password");

    params.set("username", "1234");
    await executeAndExpectError(params, "password");

    params.set("username", "invalid username");
    await executeAndExpectError(params, "password");

    params.set("username", "vAlid_us3r-name");
    await executeAndExpectError(params, "password");

    params.set("password", 12);
    await executeAndExpectError(params, "password");

    params.set("password", new Date());
    await executeAndExpectError(params, "password");

    params.set("password", {});
    await executeAndExpectError(params, "password");

    params.set("password", "");
    await executeAndExpectError(params, "password");

    params.set("password", "aaaaaaaaaaa");
    await executeAndExpectError(params, "password");

    params.set("password", "aaaaaaaaaaaA");
    await executeAndExpectError(params, "password");

    params.set("password", "aaaaaaaaaaaA2");
    await executeAndExpectError(params, "password");

    params.set("password", "aaaaaaaaaaaA2$");
    await executeAndExpectSuccess(params);

    await executeAndExpectError(params, "exists");

    params.setAll({
        username: "admin",
        password: "dtWgHbv5cSyZAtN$"
    });
    await executeAndExpectSuccess(params);

    params = new UsersRouteCreateParameters();
    await executeAndExpectError(params);
});