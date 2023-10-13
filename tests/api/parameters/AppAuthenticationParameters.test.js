"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppAuthenticationParameters } = require("../../../src/api/parameters/AppAuthenticationParameters.class");
const { AppAuthentication } = require("../../../src/api/authentication/AppAuthentication.class");
const db = require("../../db");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { DisplayableApiException } = require("../../../src/exception/DisplayableApiException.class");
const { ApiException } = require("../../../src/exception");

const httpMocks = require("node-mocks-http");
const mockRequest = require("../../_mock/request");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
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
    expect(params.authentication).toStrictEqual({})
    expect(params.toObject()).toStrictEqual({});
});

test("setAuthentication", () => {
    let params = new AppAuthenticationParameters({})
    let authenticator = new AppAuthentication();
    params.populateAuthenticator(0, authenticator);
    expect(params.authentication).toStrictEqual({ ip: "", uuid: "", signature: "" })

    authenticator.ip = "a";
    authenticator.uuid = "b";
    authenticator.signature = "c";
    expect(params.authentication).toStrictEqual({ ip: "a", uuid: "b", signature: "c" });
    expect(params.toObject()).toStrictEqual({});

    authenticator.ip = "127.0.0.1";
    authenticator.uuid = "";
    authenticator.signature = "";
    expect(params.authentication).toStrictEqual({ ip: "127.0.0.1", uuid: "", signature: "" });

    authenticator.ip = "";
    authenticator.uuid = "11b0b3af-12c0-4416-b451-a9e56d6da321";
    authenticator.signature = "";
    expect(params.authentication).toStrictEqual({
        ip: "",
        uuid: "11b0b3af-12c0-4416-b451-a9e56d6da321",
        signature: ""
    });

    authenticator.ip = "";
    authenticator.uuid = "";
    authenticator.signature = "KaMOz6SOMA==";
    expect(params.authentication).toStrictEqual({
        ip: "",
        uuid: "",
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
    expect(params.authentication).toStrictEqual({ ip: "tst", uuid: "test", signature: "test2" });
    expect(params.toObject()).toStrictEqual({});

    req = httpMocks.createRequest();
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "127.0.0.1", uuid: "", signature: "" });
    expect(params.toObject()).toStrictEqual({});

    req = mockRequest.createAuthenticationRequest("");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "", uuid: "", signature: "" });
    expect(params.toObject()).toStrictEqual({});

    req = mockRequest.createAuthenticationRequest("::1");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::1", uuid: "", signature: "" });
    expect(params.toObject()).toStrictEqual({});

    req = mockRequest.createAuthenticationRequest("::2", "tst");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::2", uuid: "tst", signature: "" });
    expect(params.toObject()).toStrictEqual({});

    req = mockRequest.createAuthenticationRequest("::3", "tst2", "foo");
    params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    expect(params.authentication).toStrictEqual({ ip: "::3", uuid: "tst2", signature: "foo" });
    expect(params.toObject()).toStrictEqual({});
});

test("validate", async () => {
    let req = mockRequest.createAuthenticationRequest();
    /**
     * @type {AppAuthenticationParameters}
     */
    let params = AppAuthenticationParameters.parse(req);
    expect(params).toBeInstanceOf(AppAuthenticationParameters);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createAuthenticationRequest("");
    params = AppAuthenticationParameters.parse(req);
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

    /**
     * @param {AppAuthenticationParameters} params
     * @param {string} errorToMatch
     * @returns {Promise<void>}
     */
    async function tryAndExpectError(params, errorToMatch = "")
    {
        try
        {
            await params.validate();
            expect(false).toBe(true);
        }
        /**
         * @type {Error}
         */
        catch (e)
        {
            expect(e.message).toMatch(errorToMatch);
        }
    }

    params = new AppAuthenticationParameters({});
    await tryAndExpectError(params, "authenticators");

    let authenticator = new AppAuthentication({});
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "IP");

    authenticator = new AppAuthentication({
        ip: "a"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "application");

    authenticator = new AppAuthentication({
        ip: "a",
        uuid: "b"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "application");

    authenticator = new AppAuthentication({
        ip: "a",
        uuid: app.uuid
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "permission");

    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "signature");

    authenticator = new AppAuthentication({
        ip: "a",
        uuid: "b",
        signature: "c"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "application");

    authenticator = new AppAuthentication({
        ip: "a",
        uuid: app.uuid,
        signature: "c"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "permission");

    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid,
        signature: "c"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "permission");

    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid,
        signature: await app.generateSignature({})
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "permission");

    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid,
        signature: await app.generateSignature({ip: "::1"})
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid,
        signature: await app.generateSignature({ip: "::2"})
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "permission");
});

test("populateAuthenticator", () => {
    let params = new AppAuthenticationParameters({});
    let authenticator = new AppAuthentication();
    expect(() => params.populateAuthenticator(1, authenticator)).toThrow(ApiException);
    expect(() => params.populateAuthenticator(0, params)).toThrow(ApiException);
    expect(() => params.populateAuthenticator(0, authenticator)).not.toThrow();
});