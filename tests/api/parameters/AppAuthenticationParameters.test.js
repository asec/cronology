"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppAuthenticationParameters } = require("../../../src/api/parameters/AppAuthenticationParameters.class");
const db = require("../../db");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication, ExternalApplicationRepository } = require("../../../src/model/ExternalApplication");
const { DisplayableApiException } = require("../../../src/exception/DisplayableApiException.class");

const httpMocks = require("node-mocks-http");
const mockRequest = require("../../_mock/request");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    Log.setLogFile("AppAuthenticationParameters.test");
    await db.connect();

    app = new ExternalApplication({
        name: "AppAuthenticationParameters-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("constructor", () => {
    let params = new AppAuthenticationParameters({
        foo: "bar",
        bar: 12
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ ip: undefined });
});

test("setAuthentication", () => {
    let params = new AppAuthenticationParameters({})
    params.setAuthentication({});
    expect(params.authentication).toStrictEqual({ ip: "", appUuid: "", signature: "" })

    params.setAuthentication({
        ip: "a",
        appUuid: "b",
        signature: "c"
    });
    expect(params.authentication).toStrictEqual({ ip: "a", appUuid: "b", signature: "c" });
    expect(params.toObject()).toStrictEqual({ ip: "a" });

    params.setAuthentication({ ip: "127.0.0.1" });
    expect(params.authentication).toStrictEqual({ ip: "127.0.0.1", appUuid: "", signature: "" });

    params.setAuthentication({ appUuid: "11b0b3af-12c0-4416-b451-a9e56d6da321" });
    expect(params.authentication).toStrictEqual({
        ip: "",
        appUuid: "11b0b3af-12c0-4416-b451-a9e56d6da321",
        signature: ""
    });

    params.setAuthentication({
        signature: "KaMOz6SOMA=="
    });
    expect(params.authentication).toStrictEqual({
        ip: "",
        appUuid: "",
        signature: "KaMOz6SOMA=="
    });
});

test("parse", () => {
    let req = mockRequest.createAuthenticationRequest("tst", "test", "test2");
    /**
     * @type {AppAuthenticationParameters}
     */
    let params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "tst", appUuid: "test", signature: "test2" });

    req = httpMocks.createRequest();
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "127.0.0.1", appUuid: "", signature: "" });

    req = mockRequest.createAuthenticationRequest();
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "", appUuid: "", signature: "" });

    req = mockRequest.createAuthenticationRequest("::1");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::1", appUuid: "", signature: "" });

    req = mockRequest.createAuthenticationRequest("::2", "tst");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::2", appUuid: "tst", signature: "" });

    req = mockRequest.createAuthenticationRequest("::3", "tst2", "foo");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::3", appUuid: "tst2", signature: "foo" });
    expect(params.toObject()).toStrictEqual({ ip: "::3" });
});

test("validate", async () => {
    let req = mockRequest.createAuthenticationRequest();
    /**
     * @type {AppAuthenticationParameters}
     */
    let params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("::2");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("::1", "11b0b3af-12c0-4416-b451-a9e56d6da321");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("::1", app.uuid, await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createAuthenticationRequest("::1", app.uuid, await app.generateSignature({ip: "::2"}));
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("::1", "test-invalid", await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("::2", app.uuid, await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("192.168.0.0", app.uuid, await app.generateSignature({ip: "192.168.0.0"}));
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    app.addIp("192.168.0.0");
    await app.save();
    expect(await params.validate()).toBe(true);
});