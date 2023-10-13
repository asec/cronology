"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DefaultRouteSignatureParameters } = require("../../../src/api/parameters");
const { DisplayableApiException } = require("../../../src/exception");

const mockRequest = require("../../_mock/request");

test("constructor", () => {
    let params = new DefaultRouteSignatureParameters({});
    expect(params.toObject()).toStrictEqual({ uuid: "", data: {} });

    params = new DefaultRouteSignatureParameters({
        uuid: "test",
        invalid: 12
    });
    expect(params.toObject()).toStrictEqual({ uuid: "test", data: {} });

    params = new DefaultRouteSignatureParameters({
        data: {
            foo: "bar",
            test: 42
        }
    });
    expect(params.toObject()).toStrictEqual({
        uuid: "",
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
        uuid: "uuid",
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
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({
        uuid: "test",
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
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({
        uuid: "test2",
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
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({
        uuid: "",
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
        "test",
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
        "test",
        undefined
    );
    params = DefaultRouteSignatureParameters.parse(req);
    expect(await params.validate()).toBe(true);
});