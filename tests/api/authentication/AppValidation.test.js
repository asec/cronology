"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppValidation } = require("../../../src/api/authentication/AppValidation.class");

const db = require("../../db");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");

const mockRequest = require("../../_mock/request");

/**
 * @type {ExternalApplication}
 */
let app;

/**
 * @param {AppValidation} params
 * @param {string} errorToMatch
 */
async function tryAndExpectError(params, errorToMatch)
{
    try
    {
        await params.validate();
        expect(false).toBe(true);
    }
    /**
     * @type {ApiException}
     */
    catch (e)
    {
        expect(e.message).toMatch(errorToMatch);
    }
}

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("AppValidation.test");
    await db.connect();

    app = new ExternalApplication({
        name: "AppValidation-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("constructor / setAll / set", () => {
    let auth = new AppValidation({});
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: ""
    });

    auth = new AppValidation({
        uuid: "aa",
        ip: 12
    });
    expect(auth.toObject()).toStrictEqual({
        uuid: "aa",
        ip: 12
    });

    expect(auth.setAll({
        uuid: "b",
        ip: "c"
    })).toBe(true);
    expect(auth.toObject()).toStrictEqual({
        uuid: "b",
        ip: "c"
    });

    expect(auth.setAll({
        uuid: "uuid"
    })).toBe(true);
    expect(auth.toObject()).toStrictEqual({
        uuid: "uuid",
        ip: "c"
    });

    expect(auth.setAll({
        ip: "ip"
    })).toBe(true);
    expect(auth.toObject()).toStrictEqual({
        uuid: "uuid",
        ip: "ip"
    });

    expect(auth.setAll({
        foo: "bar",
        uuid: "appUuid"
    })).toBe(false);
    expect(auth.toObject()).toStrictEqual({
        uuid: "appUuid",
        ip: "ip"
    });

    expect(auth.set("uuid", "aaa")).toBe(true);
    expect(auth.toObject()).toStrictEqual({
        uuid: "aaa",
        ip: "ip"
    });

    expect(auth.set("ip", Infinity)).toBe(true);
    expect(auth.toObject()).toStrictEqual({
        uuid: "aaa",
        ip: Infinity
    });

    expect(auth.set("foo", "bar")).toBe(false);
    expect(auth.toObject()).toStrictEqual({
        uuid: "aaa",
        ip: Infinity
    });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined
    );
    let auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: "127.0.0.1"
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        null,
        undefined,
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: ""
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "",
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: ""
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::1",
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: "::1"
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        42,
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: 42
    });

    let now = new Date();
    req = mockRequest.createFullRequest(
        "post",
        "/",
        now,
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: now
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::1",
        null,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: "::1"
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::1",
        "",
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: "",
        ip: "::1"
    });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::1",
        app.uuid,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(auth).toBeInstanceOf(AppValidation);
    expect(auth.toObject()).toStrictEqual({
        uuid: app.uuid,
        ip: "::1"
    });
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined
    );
    let auth = AppValidation.parse(req);
    await tryAndExpectError(auth, "invalid application");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "",
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    await tryAndExpectError(auth, "invalid IP");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::1",
        undefined,
        undefined
    );
    auth = AppValidation.parse(req);
    await tryAndExpectError(auth, "invalid application");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        "test",
        undefined
    );
    auth = AppValidation.parse(req);
    await tryAndExpectError(auth, "invalid application");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        app.uuid,
        undefined
    );
    auth = AppValidation.parse(req);
    expect(await auth.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/",
        "::2",
        app.uuid,
        undefined
    );
    auth = AppValidation.parse(req);
    await tryAndExpectError(auth, "permission");
});