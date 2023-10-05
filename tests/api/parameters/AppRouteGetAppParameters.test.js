"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppRouteGetAppParameters } = require("../../../src/api/parameters/AppRouteGetAppParameters.class");
const db = require("../../db")
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { Log } = require("../../../src/model/Log");
const { DisplayableApiException } = require("../../../src/exception");

const mockRequest = require("../../_mock/request");
const {AppAuthenticationParameters} = require("../../../src/api/parameters/AppAuthenticationParameters.class");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("AppRouteGetAppParameters-test");
    await db.connect();

    app = new ExternalApplication({
        name: "AppRouteGetAppParameters-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("constructor", () => {
    let params = new AppRouteGetAppParameters({});
    expect(params.toObject()).toStrictEqual({ uuid: "" });

    params = new AppRouteGetAppParameters({
        uuid: "aaa"
    });
    expect(params.toObject()).toStrictEqual({ uuid: "aaa" });

    params = new AppRouteGetAppParameters({
        uuid: 12
    });
    expect(params.toObject()).toStrictEqual({ uuid: 12 });
});

test("parse", () => {
    let req = mockRequest.createFullAuthenticationRequest(
        "get",
        "/app/aaa",
        "::1",
        "appUuid",
        "signature",
        {
            uuid: 12
        }
    );

    let params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    expect(params.toObject()).toStrictEqual({ uuid: 12 });

    req = mockRequest.createAuthenticationRequest("::2", "uuid", "sign");
    params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    expect(params.toObject()).toStrictEqual({ uuid: undefined });
});

test("validate", async () => {
    let req = mockRequest.createAuthenticationRequest(
        "::1",
        app.uuid,
        await app.generateSignature({ ip: "::1" })
    );
    let params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createFullAuthenticationRequest(
        "get",
        "/app/" + app.uuid,
        "::1",
        app.uuid,
        await app.generateSignature({ uuid: app.uuid, ip: "::1" }),
        {
            uuid: app.uuid
        }
    );
    params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullAuthenticationRequest(
        "get",
        "/app/test",
        "::1",
        app.uuid,
        await app.generateSignature({ uuid: "test", ip: "::1" }),
        {
            uuid: app.uuid
        }
    );
    params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createFullAuthenticationRequest(
        "get",
        "/app/" + 12,
        "::1",
        12,
        await app.generateSignature({ uuid: 12, ip: "::1" }),
        {
            uuid: 12
        }
    );
    params = AppRouteGetAppParameters.parse(req);
    expect(params).toBeInstanceOf(AppRouteGetAppParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);
});