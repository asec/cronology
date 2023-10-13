"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { ScheduleRouteScheduleParameters } = require("../../../src/api/parameters");
const { AppValidation } = require("../../../src/api/authentication");
const { ApiException } = require("../../../src/exception");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { Log } = require("../../../src/model/Log");

const db = require("../../db");
const mockRequest = require("../../_mock/request");

/**
 * @type {ExternalApplication}
 */
let app;

/**
 * @param {ScheduleRouteScheduleParameters} params
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
    Log.setLogFile("ScheduleRouteScheduleParameters.test");

    await db.connect();

    app = new ExternalApplication({
        name: "ScheduleRouteScheduleParameters-test"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    await db.tearDown();
    app.deleteKeys();
});

test("constructor / set / setAll", () => {
    let params = new ScheduleRouteScheduleParameters({});
    expect(params.toObject()).toStrictEqual({
        schedule: '',
        limit: 0
    });

    params = new ScheduleRouteScheduleParameters({
        schedule: "aaa",
        limit: 20
    });
    expect(params.toObject()).toStrictEqual({
        schedule: 'aaa',
        limit: 20
    });

    expect(params.setAll({
        schedule: "b",
        limit: 1
    })).toBe(true);
    expect(params.toObject()).toStrictEqual({
        schedule: 'b',
        limit: 1
    });

    expect(params.setAll({
        schedule: "bb",
        limit: 11,
        foo: new Date()
    })).toBe(false);
    expect(params.toObject()).toStrictEqual({
        schedule: 'bb',
        limit: 11
    });

    expect(params.set("schedule", 10)).toBe(true);
    expect(params.toObject()).toStrictEqual({
        schedule: 10,
        limit: 11
    });

    expect(params.set("limit", "aa")).toBe(true);
    expect(params.toObject()).toStrictEqual({
        schedule: 10,
        limit: "aa"
    });

    expect(params.set("bar", "baz")).toBe(false);
    expect(params.toObject()).toStrictEqual({
        schedule: 10,
        limit: "aa"
    });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        undefined,
        undefined
    );
    let params = ScheduleRouteScheduleParameters.parse(req);
    expect(params).toBeInstanceOf(ScheduleRouteScheduleParameters);
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: ""
    });
    expect(params.toObject()).toStrictEqual({
        schedule: '',
        limit: 0
    });

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        undefined,
        undefined,
        {},
        {
            limit: 1
        },
        {
            schedule: "a"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(params).toBeInstanceOf(ScheduleRouteScheduleParameters);
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: ""
    });
    expect(params.toObject()).toStrictEqual({
        schedule: 'a',
        limit: 1
    });

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        undefined,
        undefined,
        {},
        {
            limit: 11
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(params).toBeInstanceOf(ScheduleRouteScheduleParameters);
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: ""
    });
    expect(params.toObject()).toStrictEqual({
        schedule: '',
        limit: 11
    });

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        undefined,
        undefined,
        {},
        undefined,
        {
            schedule: "now"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(params).toBeInstanceOf(ScheduleRouteScheduleParameters);
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: ""
    });
    expect(params.toObject()).toStrictEqual({
        schedule: 'now',
        limit: 0
    });
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        undefined,
        undefined
    );
    let params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "invalid application");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "schedule");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {},
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: "bbb"
        },
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: "-1"
        },
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "limit");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: 1000000
        },
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "limit");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: new Date()
        },
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "limit");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: (new Date()).toString()
        },
        {
            schedule: "aa"
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    expect(await params.validate()).toBe(true);

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: 1
        },
        {
            schedule: ""
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "schedule");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: 1
        },
        {
            schedule: null
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "schedule");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: 1
        },
        {
            schedule: undefined
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "schedule");

    req = mockRequest.createFullRequest(
        "post",
        "/schedule",
        undefined,
        app.uuid,
        undefined,
        {},
        {
            limit: 1
        },
        {
            schedule: new Date()
        }
    );
    params = ScheduleRouteScheduleParameters.parse(req);
    await tryAndExpectError(params, "schedule");
});

test("validate (manual)", async () => {
    let params = new ScheduleRouteScheduleParameters({});
    await tryAndExpectError(params, "authenticators");

    let authenticator = new AppValidation({
        ip: "::1",
        uuid: app.uuid
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "schedule");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa"
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: "bbb"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: "-1"
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: -1
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: 1000000
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: new Date()
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: (new Date()).toString()
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "limit");

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: 0
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    params = new ScheduleRouteScheduleParameters({
        schedule: "aa",
        limit: 1
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    params = new ScheduleRouteScheduleParameters({
        schedule: "",
        limit: 1
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "schedule");

    params = new ScheduleRouteScheduleParameters({
        schedule: null,
        limit: 1
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "schedule");

    params = new ScheduleRouteScheduleParameters({
        schedule: undefined,
        limit: 1
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "schedule");

    params = new ScheduleRouteScheduleParameters({
        schedule: new Date(),
        limit: 1
    });
    params.populateAuthenticator(0, authenticator);
    await tryAndExpectError(params, "schedule");
});