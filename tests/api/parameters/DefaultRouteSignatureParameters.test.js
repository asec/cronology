"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { DefaultRouteSignatureParameters } = require("../../../src/api/parameters");
const { DisplayableApiException } = require("../../../src/exception");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");

const mockRequest = require("../../_mock/request");
const db = require("../../db");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("DefaultRouteSignatureParameters.test");
    await db.connect();

    app = new ExternalApplication({
        name: "DefaultRouteSignatureParameters-test"
    });
    await app.save();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("constructor", () => {
    let params = new DefaultRouteSignatureParameters({});
    expect(params.toObject()).toStrictEqual({ data: {} });

    params = new DefaultRouteSignatureParameters({
        uuid: "test",
        invalid: 12
    });
    expect(params.toObject()).toStrictEqual({ data: {} });

    params = new DefaultRouteSignatureParameters({
        data: {
            foo: "bar",
            test: 42
        }
    });
    expect(params.toObject()).toStrictEqual({
        data: {
            foo: "bar",
            test: 42
        }
    });

    params = new DefaultRouteSignatureParameters({
        uuid: "uuid",
        data: {
            data: "data"
        }
    });
    expect(params.toObject()).toStrictEqual({
        data: {
            data: "data"
        }
    });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/signature",
        "::1",
        "test",
        undefined,
        {},
        {},
        {
            foo: "bar",
            bar: "baz",
            ip: "::2"
        }
    );
    let params = DefaultRouteSignatureParameters.parse(req);
    expect(params).toBeInstanceOf(DefaultRouteSignatureParameters);
    expect(params.authentication).toStrictEqual({
        uuid: "test",
        ip: "::1"
    });
    expect(params.toObject()).toStrictEqual({
        data: {
            foo: "bar",
            bar: "baz",
            ip: "::2"
        }
    });

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        "::1",
        "test2",
        undefined,
        {},
        {},
        {
            user_id: 12
        }
    );
    params = DefaultRouteSignatureParameters.parse(req);
    expect(params).toBeInstanceOf(DefaultRouteSignatureParameters);
    expect(params.authentication).toStrictEqual({
        uuid: "test2",
        ip: "::1"
    });
    expect(params.toObject()).toStrictEqual({
        data: {
            user_id: 12,
            ip: "::1"
        }
    });

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        undefined,
        undefined,
        undefined,
    );
    params = DefaultRouteSignatureParameters.parse(req);
    expect(params).toBeInstanceOf(DefaultRouteSignatureParameters);
    expect(params.authentication).toStrictEqual({
        uuid: "",
        ip: "127.0.0.1"
    });
    expect(params.toObject()).toStrictEqual({
        data: {
            ip: "127.0.0.1"
        }
    });
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/signature",
        "::1",
        app.uuid,
        ""
    );
    let params = DefaultRouteSignatureParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        undefined,
        undefined,
        undefined
    );
    params = DefaultRouteSignatureParameters.parse(req);
    await expect(() => params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        undefined,
        "",
        undefined
    );
    params = DefaultRouteSignatureParameters.parse(req);
    await expect(() => params.validate()).rejects.toThrow(DisplayableApiException);

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        undefined,
        app.uuid,
        undefined
    );
    params = DefaultRouteSignatureParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/signature",
        "::2",
        app.uuid,
        undefined
    );
    params = DefaultRouteSignatureParameters.parse(req);
    await expect(() => params.validate()).rejects.toThrow(DisplayableApiException);
});