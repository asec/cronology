"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { UsersRouteCreateParameters } = require("../../../src/api/parameters/UsersRouteCreateParameters.class");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { Log } = require("../../../src/model/Log");
const { DisplayableApiException } = require("../../../src/exception");
const db = require("../../db");

const mockRequest = require("../../_mock/request")
const {AppRouteGetAppParameters} = require("../../../src/api/parameters/AppRouteGetAppParameters.class");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    Log.setLogFile("UsersRouteCreateParameters-test");
    env.enableSilentLogging();

    await db.connect();
    app = new ExternalApplication({
        name: "UsersRouteCreateParameters-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

/**
 * @param {string} username
 * @param {string} password
 * @param {string|null} [ip = null]
 * @param {string|null} [uuid = null]
 * @param {string|null} [signature = null]
 * @returns {Promise<{params: UsersRouteCreateParameters, requestData: {username: string, password: string}}>}
 */
async function parseParamsFromMockRequest(username, password, ip = null, uuid = null, signature = null)
{
    let requestData = {
        username,
        password
    };
    if (typeof requestData.username === "undefined")
    {
        delete requestData.username;
    }
    if (typeof requestData.password === "undefined")
    {
        delete requestData.password;
    }
    let req = mockRequest.createFullAuthenticationRequest(
        "put",
        "/user",
        ip || "::1",
        uuid || app.uuid,
        signature || await app.generateSignature({ ...requestData, ip: ip || "::1" }),
        {},
        requestData
    );

    return {
        params: UsersRouteCreateParameters.parse(req),
        requestData
    };
}

test("constructor", () => {
    let params = new UsersRouteCreateParameters({});
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "", password: "", ip: undefined });

    params = new UsersRouteCreateParameters({
        username: "test"
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "test", password: "", ip: undefined });

    params = new UsersRouteCreateParameters({
        password: "test2"
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "", password: "test2", ip: undefined });

    params = new UsersRouteCreateParameters({
        username: "test2",
        password: "test3"
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "test2", password: "test3", ip: undefined });
});

test("parse", async () => {

    let {
        params,
        requestData
    } = await parseParamsFromMockRequest("a", "b", "::1", app.uuid, "test");
    expect(params).toBeInstanceOf(UsersRouteCreateParameters);
    expect(params.authentication).toStrictEqual({ ip: "::1", appUuid: app.uuid, signature: "test" });
    expect(params.toObject()).toStrictEqual({ ...requestData, ip: "::1" });

    let result = await parseParamsFromMockRequest(
        1,
        undefined,
        "::1",
        app.uuid,
        "test2"
    );
    params = result.params;
    requestData = result.requestData;
    expect(params).toBeInstanceOf(UsersRouteCreateParameters);
    expect(params.authentication).toStrictEqual({ ip: "::1", appUuid: app.uuid, signature: "test2" });
    expect(params.toObject()).toStrictEqual({ ...requestData, password: "", ip: "::1" });

    result = await parseParamsFromMockRequest(undefined, new Date(), "::2", app.uuid, "test2");
    params = result.params;
    requestData = result.requestData;
    expect(params).toBeInstanceOf(UsersRouteCreateParameters);
    expect(params.authentication).toStrictEqual({ ip: "::2", appUuid: app.uuid, signature: "test2" });
    expect(params.toObject()).toStrictEqual({ ...requestData, username: "", ip: "::2" });
});

test("validate", async () => {
    let { params } = await parseParamsFromMockRequest("admin", "dtWgHbv5cSyZAtN$");
    expect(params).toBeInstanceOf(UsersRouteCreateParameters);
    expect(await params.validate()).toBe(true);

    let result= await parseParamsFromMockRequest(12, "b");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("aaa", "b");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("tesztelő", "b");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", 12);
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", "a");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", "aaaaaaaaaaaa");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", "aaaaaaaaaaaaA");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", "aaaaaaaaaaaaA1");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    await expect(result.params.validate()).rejects.toThrow(DisplayableApiException);

    result = await parseParamsFromMockRequest("admin", "aaaaaaaaaaaaA1$");
    expect(result.params).toBeInstanceOf(UsersRouteCreateParameters);
    expect(await result.params.validate()).toBe(true);
});