"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const db = require("../db");
const { Api } = require("../../src/api/Api.class");
const {
    ApiError,
    ApiResult,
    PingResponse,
    DefaultSignatureResult,
    ScheduleRouteScheduleResult
} = require("../../src/api/responses");
const {
    DefaultRouteSignatureParameters,
    UsersRouteCreateAccessTokenParameters,
    ScheduleRouteScheduleParameters
} = require("../../src/api/parameters");
const { Log } = require("../../src/model/Log");
const { ExternalApplication } = require("../../src/model/ExternalApplication");
const { User } = require("../../src/model/User");
const { UserRepository } = require("../model/repository/User.repository");

/**
 * @type {ExternalApplication};
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("test-Api.test");
    await db.connect();
    await Api.init();

    app = new ExternalApplication({
        name: "Api-test-global"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    if (db.getReadyState() !== 1)
    {
        await db.connect();
    }
    app.deleteKeys();
    await db.tearDown();
});

test("init", async () => {
    await expect(Api.init()).rejects.toThrow();
});

test("getRoutes", () => {
    let routes = Api.getRoutes();
    expect(routes.get).toHaveLength(4);
    expect(routes.post).toHaveLength(3);
    expect(routes.put).toHaveLength(1);
    expect(routes.delete).toHaveLength(1);
});

test("execute: DefaultRoute", async () => {
    const packageInfo = require("../../package.json");
    let response = await Api.execute("get", "/");
    /**
     * @type {PingResponseBean}
     */
    let responseData = response.toObject();
    expect(response).toBeInstanceOf(PingResponse);
    expect(responseData).toHaveProperty("success");
    expect(responseData).toHaveProperty("version");
    expect(responseData.success).toBe(true);
    expect(responseData.version).toMatch("test");
    expect(responseData.version).toMatch(packageInfo.version);

    response = await Api.execute("get", "/test-error");
    expect(response).toBeInstanceOf(ApiError);

    await expect(Api.execute("get2", "/")).rejects.toThrow(Error);
    await expect(Api.execute("get", "/2")).rejects.toThrow(Error);

    response = await Api.execute("get", "/bad-response");
    expect(response).toBeInstanceOf(ApiError);

    let signatureData = {
        foo: "bar"
    };
    let params = new DefaultRouteSignatureParameters({
        uuid: app.uuid,
        data: signatureData
    });
    response = await Api.execute("post", "/signature", params);
    expect(response).toBeInstanceOf(DefaultSignatureResult);
    expect(response.success).toBe(true);
    expect(typeof response.result).toBe("string");
    expect(response.result.length).toBeGreaterThan(10);
    expect(response.result).toBe(await app.generateSignature(signatureData));

    params = new DefaultRouteSignatureParameters({
        uuid: "test",
        data: signatureData
    });
    response = await Api.execute("post", "/signature", params);
    expect(response).toBeInstanceOf(ApiError);
    expect(response.error).toMatch("uuid");

    params = new DefaultRouteSignatureParameters({});
    response = await Api.execute("post", "/signature", params);
    expect(response.error).toMatch("uuid");
});

test("execute: AppRoute::getAppByUuid", async () => {
    const { AppRouteGetAppParameters } = require("../../src/api/parameters/AppRouteGetAppParameters.class");
    const { AppAuthentication } = require("../../src/api/authentication/AppAuthentication.class");
    const { ExternalApplication } = require("../../src/model/ExternalApplication");

    let app = new ExternalApplication({
        name: "Api-test"
    });
    let params = new AppRouteGetAppParameters({
       uuid: app.uuid
    });

    let authenticator = new AppAuthentication();

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

    authenticator.ip = "::2";
    params.populateAuthenticator(0, authenticator);
    await executeAndExpectError(params, "permission");

    app.addIp("::2");
    await app.save();
    await executeAndExpectSuccess(params);

    authenticator.ip = "";
    authenticator.uuid = app.uuid;
    await executeAndExpectError(params, "permission");

    authenticator.ip = "::1";
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
    const { UsersCreateUserResult } = require("../../src/api/responses");
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
         * @type {UsersCreateUserResultBean}
         */
        let responseObject = response.toObject();
        expect(response).toBeInstanceOf(UsersCreateUserResult);
        expect(responseObject.success).toBe(true);
        expect(responseObject.result).toStrictEqual(response.toObject().result);
        expect(responseObject.result._id).toBeUndefined();
        expect(responseObject.result.__v).toBeUndefined();
        expect(responseObject.result.id).not.toBeUndefined();
        expect(responseObject.result.password).toBeUndefined();
        expect(responseObject.result.username).toBe(params.username);
        expect(responseObject.result.accessToken).not.toBeUndefined();
        expect(typeof responseObject.result.accessToken).toBe("string");
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

    params.set("username", "info@localhost.com");
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

test("execute: UsersRoute::createAccessToken", async () => {
    let user = new User({
        username: "tst",
        password: User.generateRandomPassword()
    });
    await user.save();

    let prevAccessToken = user.accessToken;

    let params = new UsersRouteCreateAccessTokenParameters({
        user_id: user.id.toString()
    });
    let response = await Api.execute("post", "/user/accessToken", params);
    expect(response.success).toBe(true);
    expect(response.result.username).toBe(user.username);
    expect(typeof response.result.accessToken).toBe("string");
    expect(response.result.accessToken.length).toBeGreaterThan(10);
    expect(response.result.accessToken).not.toBe(prevAccessToken);
    expect(response.result.accessTokenValid).toBeInstanceOf(Date);

    params = new UsersRouteCreateAccessTokenParameters({
        user_id: user.id
    });
    response = await Api.execute("post", "/user/accessToken", params);
    expect(response.success).toBe(true);
    expect(response.result.username).toBe(user.username);
    expect(typeof response.result.accessToken).toBe("string");
    expect(response.result.accessToken.length).toBeGreaterThan(10);
    expect(response.result.accessToken).not.toBe(prevAccessToken);
    expect(response.result.accessTokenValid).toBeInstanceOf(Date);
    prevAccessToken = response.result.accessToken;

    params = new UsersRouteCreateAccessTokenParameters({});
    response = await Api.execute("post", "/user/accessToken", params);
    expect(response).toBeInstanceOf(ApiError);
    expect(response.error).toMatch("ObjectId");

    params = new UsersRouteCreateAccessTokenParameters({
        user_id: null
    });
    response = await Api.execute("post", "/user/accessToken", params);
    expect(response).toBeInstanceOf(ApiError);
    expect(response.error).toMatch("user");

    params = new UsersRouteCreateAccessTokenParameters({
        user_id: undefined
    });
    response = await Api.execute("post", "/user/accessToken", params);
    expect(response).toBeInstanceOf(ApiError);
    expect(response.error).toMatch("user");

    params = new UsersRouteCreateAccessTokenParameters({
        user_id: "000000000000000000000000"
    });
    response = await Api.execute("post", "/user/accessToken", params);
    expect(response).toBeInstanceOf(ApiError);
    expect(response.error).toMatch("user");

    user = await UserRepository.findOne({
        username: user.username
    });
    expect(user.accessToken).toBe(prevAccessToken);
});

test("execute: ScheduleRoute::schedule", async () => {
    let user = await UserRepository.createRandom();
    user.createNewAccessToken();
    await user.save();

    /**
     * @param {ScheduleRouteScheduleParameters} params
     * @param errorToMatch
     */
    async function tryAndExpectError(params, errorToMatch)
    {
        let response = await Api.execute("post", "/schedule", params);
        expect(response).toBeInstanceOf(ApiError);
        expect(response.success).toBe(false);
        expect(response.toObject().error).toMatch(errorToMatch);
    }

    /**
     * @param params
     * @returns {Promise<ScheduleRouteScheduleResult>}
     */
    async function tryAndExpectSuccess(params)
    {
        let now = new Date();
        /**
         * @type {ScheduleRouteScheduleResult}
         */
        let response = await Api.execute("post", "/schedule", params);
        expect(response).toBeInstanceOf(ScheduleRouteScheduleResult);
        expect(response.success).toBe(true);
        expect(now.getTime() - response.now.getTime()).toBeLessThanOrEqual(100);

        return response;
    }

    let params = new ScheduleRouteScheduleParameters({});
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: 12
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: ""
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: null
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: undefined
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: "test"
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: "now"
    });
    let response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(1);
    expect(response.now.toString()).toBe(response.next[0].toString());

    params.setAll({
        schedule: "now",
        limit: 5
    });
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(1);
    expect(response.now.toString()).toBe(response.next[0].toString());

    let correctDate = new Date(Date.UTC(2020, 0));
    params.setAll({
        schedule: "2020-01-01 00:00:00",
        limit: 5
    });
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(1);
    expect(response.next[0]).toStrictEqual(correctDate);

    params.setAll({
        schedule: "202-01-01 00:00:00",
        limit: 20
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: "2020-01-01 00:0:00",
        limit: 20
    });
    await tryAndExpectError(params, "schedule");

    params.setAll({
        schedule: "* * * * *"
    });
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(20);

    params.setAll({
        schedule: "* * * * *",
        limit: 5
    });
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(5);
    let last = new Date();
    last.setSeconds(0, 0);
    for (let i = 0; i < 5; i++)
    {
        let next = response.toObject().next[i];
        expect(next).toBeInstanceOf(Date);
        expect(next > last).toBe(true);
        last = next;
    }

    params.setAll({
        schedule: "0 */6 31 9"
    });
    response = await tryAndExpectError(params, "schedule");

    params.set("schedule", "5 5 29 2 *");
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(5);
    last = new Date();
    last.setSeconds(0, 0);
    for (let i = 0; i < 5; i++)
    {
        let next = response.toObject().next[i];
        expect(next).toBeInstanceOf(Date);
        expect(next > last).toBe(true);
        last = next;
    }

    params.set("limit", 10);
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(10);
    last = new Date();
    last.setSeconds(0, 0);
    for (let i = 0; i < 10; i++)
    {
        let next = response.toObject().next[i];
        expect(next).toBeInstanceOf(Date);
        expect(next > last).toBe(true);
        last = next;
    }

    params.set("limit", 0);
    response = await tryAndExpectSuccess(params);
    expect(response.next).toHaveLength(1);
    last = new Date();
    last.setSeconds(0, 0);
    for (let i = 0; i < 1; i++)
    {
        let next = response.toObject().next[i];
        expect(next).toBeInstanceOf(Date);
        expect(next > last).toBe(true);
        last = next;
    }
});