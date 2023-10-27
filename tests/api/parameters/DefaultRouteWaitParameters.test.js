"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll } = require("@jest/globals");
const { DefaultRouteWaitParameters } = require("../../../src/api/parameters");

const mockRequest = require("../../_mock/request");

/**
 * @param {DefaultRouteWaitParameters} params
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

beforeAll(() => {
    env.enableSilentLogging();
});

test("constructor / setAll / set", () => {
    let params = new DefaultRouteWaitParameters({});
    expect(params.toObject()).toStrictEqual({
        ms: 1000
    });

    params = new DefaultRouteWaitParameters({
        ms: 20
    });
    expect(params.toObject()).toStrictEqual({
        ms: 20
    });

    params = new DefaultRouteWaitParameters({
        ms: "aaa"
    });
    expect(params.toObject()).toStrictEqual({
        ms: "aaa"
    });

    params = new DefaultRouteWaitParameters({
        ms: 10,
        foo: "bar"
    });
    expect(params.toObject()).toStrictEqual({
        ms: 10
    });

    expect(params.setAll({
        ms: 1
    })).toBe(true);
    expect(params.toObject()).toStrictEqual({
        ms: 1
    });

    expect(params.setAll({
        ms: 2,
        bar: new Date()
    })).toBe(false);
    expect(params.toObject()).toStrictEqual({
        ms: 2
    });

    expect(params.setAll({
        foo: 1
    })).toBe(false);
    expect(params.toObject()).toStrictEqual({
        ms: 2
    });

    expect(params.set("ms", 10)).toBe(true);
    expect(params.toObject()).toStrictEqual({
        ms: 10
    });

    expect(params.set("ms", "10")).toBe(true);
    expect(params.toObject()).toStrictEqual({
        ms: "10"
    });

    expect(params.set("mss", 20)).toBe(false);
    expect(params.toObject()).toStrictEqual({
        ms: "10"
    });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined
    );
    let params = DefaultRouteWaitParameters.parse(req);
    expect(params.toObject()).toStrictEqual({
        ms: 1000
    });

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: 1
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    expect(params.toObject()).toStrictEqual({
        ms: 1
    });

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "10"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    expect(params.toObject()).toStrictEqual({
        ms: 10
    });

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "aaa"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    expect(params.toObject()).toStrictEqual({
        ms: NaN
    });
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined
    );
    let params = DefaultRouteWaitParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: 1
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "10"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "aaa"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    await tryAndExpectError(params, "ms");

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "-10"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    await tryAndExpectError(params, "ms");

    req = mockRequest.createFullRequest(
        "get",
        "/wait",
        undefined,
        undefined,
        undefined,
        {},
        {
            ms: "30001"
        }
    );
    params = DefaultRouteWaitParameters.parse(req);
    await tryAndExpectError(params, "ms");
});

test("validate (manual)", async () => {
    let params = new DefaultRouteWaitParameters({});
    expect(await params.validate()).toBe(true);

    params.set("ms", 10);
    expect(await params.validate()).toBe(true);

    params.set("ms", "100");
    await tryAndExpectError(params, "ms");

    params.set("ms", "aaa");
    await tryAndExpectError(params, "ms");

    params.set("ms", -10);
    await tryAndExpectError(params, "ms");

    params.set("ms", 40000);
    await tryAndExpectError(params, "ms");
});