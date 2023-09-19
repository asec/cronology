"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { AppAuthenticationParameters } = require("../../../src/api/parameters/AppAuthenticationParameters.class");
const express = require("express");
const db = require("../../db");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication, ExternalApplicationRepository } = require("../../../src/model/ExternalApplication");
const { DisplayableApiException } = require("../../../src/exception/DisplayableApiException.class");

const httpMocks = require("node-mocks-http");
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
    await ExternalApplicationRepository.truncate();
    app.deleteKeys();
    await db.tearDown();
});

/**
 * @param {string} [ip]
 * @param {string} [uuid]
 * @param {string} [signature]
 * @returns {{}}
 */
function createMockRequestParameters(ip, uuid, signature)
{
    return {
        ip,
        headers: {
            "Crnlg-App": uuid,
            "Crnlg-Signature": signature
        }
    };
}

/**
 * @param {string} [ip]
 * @param {string} [uuid]
 * @param {string} [signature]
 * @returns {MockRequest<express.Request>}
 */
function createMockAuthenticationRequest(ip, uuid, signature)
{
    /**
     * @type {MockRequest<express.Request>}
     */
    let req = httpMocks.createRequest(createMockRequestParameters(ip, uuid, signature));
    return req;
}

/**
 * @param {string} method
 * @param {string} endpoint
 * @param {string} ip
 * @param {string} uuid
 * @param {string} signature
 * @param {{}} params
 * @param {{}} body
 * @returns {MockRequest<express.Request>}
 */
function createMockFullAuthenticationRequest(method, endpoint, ip, uuid, signature, params = {}, body = {})
{
    let requestDescriptor = createMockRequestParameters(ip, uuid, signature);
    /**
     * @type {MockRequest<express.Request>}
     */
    let req = httpMocks.createRequest({
        ...requestDescriptor,
        method,
        url: "https://localhost:7331" + endpoint,
        params,
        body
    });

    return req;
}

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
    let req = createMockAuthenticationRequest("tst", "test", "test2");
    /**
     * @type {AppAuthenticationParameters}
     */
    let params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "tst", appUuid: "test", signature: "test2" });

    req = httpMocks.createRequest();
    params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "127.0.0.1", appUuid: "", signature: "" });

    req = createMockAuthenticationRequest();
    params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "", appUuid: "", signature: "" });

    req = createMockAuthenticationRequest("::1");
    params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "::1", appUuid: "", signature: "" });

    req = createMockAuthenticationRequest("::2", "tst");
    params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "::2", appUuid: "tst", signature: "" });

    req = createMockAuthenticationRequest("::3", "tst2", "foo");
    params = AppAuthenticationParameters.parse(req);
    expect(params.authentication).toStrictEqual({ ip: "::3", appUuid: "tst2", signature: "foo" });
    expect(params.toObject()).toStrictEqual({ ip: "::3" });
});

test("validate", async () => {
    let req = createMockAuthenticationRequest();
    /**
     * @type {AppAuthenticationParameters}
     */
    let params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = createMockAuthenticationRequest("::2");
    params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = createMockAuthenticationRequest("::1", "11b0b3af-12c0-4416-b451-a9e56d6da321");
    params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = createMockAuthenticationRequest("::1", app.uuid, await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = createMockAuthenticationRequest("::1", app.uuid, await app.generateSignature({ip: "::2"}));
    params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = createMockAuthenticationRequest("::1", "test-invalid", await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);

    req = createMockAuthenticationRequest("::2", app.uuid, await app.generateSignature({ip: "::1"}));
    params = AppAuthenticationParameters.parse(req);
    await expect(params.validate()).rejects.toThrow(DisplayableApiException);
});