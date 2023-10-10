"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { UsersRouteCreateAccessTokenParameters } = require("../../../src/api/parameters");
const { DisplayableApiException } = require("../../../src/exception");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { Log } = require("../../../src/model/Log");

const mockRequest = require("../../_mock/request");
const db = require("../../db");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("UsersRouteCreateAccessTokenParameters.test");
    await db.connect();

    app = new ExternalApplication({
        name: "UsersRouteCreateAccessTokenParameters-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("constructor", () => {
    let params = new UsersRouteCreateAccessTokenParameters({});
    expect(params.toObject()).toStrictEqual({ user_id: "" });

    params = new UsersRouteCreateAccessTokenParameters({ user_id: "test" });
    expect(params.toObject()).toStrictEqual({ user_id: "test" });

    params = new UsersRouteCreateAccessTokenParameters({ user_id: 12 });
    expect(params.toObject()).toStrictEqual({ user_id: 12 });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        "test",
        "tst",
        {},
        {
            user_id: "aaa"
        }
    );
    let params = UsersRouteCreateAccessTokenParameters.parse(req);
    expect(params).toBeInstanceOf(UsersRouteCreateAccessTokenParameters);
    expect(params.authentication).toStrictEqual({
        uuid: "test",
        ip: "::1",
        signature: "tst"
    });
    expect(params.toObject()).toStrictEqual({ user_id: "aaa" });

    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        undefined,
        undefined,
        undefined
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    expect(params).toBeInstanceOf(UsersRouteCreateAccessTokenParameters);
    expect(params.authentication).toStrictEqual({
        uuid: "",
        ip: "127.0.0.1",
        signature: ""
    });
    expect(params.toObject()).toStrictEqual({ user_id: "" });
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        "test",
        "tst",
        {},
        {
            user_id: "aaa"
        }
    );
    let params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("invalid application");
    }

    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        "tst",
        {},
        {
            user_id: "aaa"
        }
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("permission");
    }

    let data = {
        user_id: "aaa"
    };
    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        await app.generateSignature(data),
        {},
        data
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("permission");
    }

    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        await app.generateSignature({ ...data, ip: "::1"}),
        {},
        data
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("user_id");
    }

    data = {
        user_id: null
    };
    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        await app.generateSignature({ ...data, ip: "::1"}),
        {},
        data
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("user_id");
    }

    data = {};
    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        await app.generateSignature({ ...data, ip: "::1"}),
        {},
        data
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {DisplayableApiException}
     */
    catch (e)
    {
        expect(e).toBeInstanceOf(DisplayableApiException);
        expect(e.message).toMatch("permission");
    }

    data = {
        user_id: "6521d40107daae676e99b894"
    };
    req = mockRequest.createFullRequest(
        "post",
        "/user/accessToken",
        "::1",
        app.uuid,
        await app.generateSignature({ ...data, ip: "::1" }),
        {},
        data
    );
    params = UsersRouteCreateAccessTokenParameters.parse(req);
    expect(await params.validate()).toBe(true);
});