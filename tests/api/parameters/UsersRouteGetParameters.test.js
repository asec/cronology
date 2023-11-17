"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { UsersRouteGetParameters } = require("../../../src/api/parameters");
const { Log } = require("../../../src/model/Log");
const { ExternalApplication } = require("../../../src/model/ExternalApplication");
const { User } = require("../../../src/model/User");
const { UserRepository } = require("../../model/repository/User.repository");

const mockRequest = require("../../_mock/request");
const db = require("../../db");

/**
 * @type {ExternalApplication}
 */
let app;
/**
 * @type {User}
 */
let user;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("UsersRouteGetParameters.test");

    await db.connect();

    app = new ExternalApplication({
        name: "UsersRouteGetParameters-test"
    });
    await app.generateKeys();
    await app.save();

    user = await UserRepository.createRandom();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

/**
 * @typedef {{}} ParseFromRequestConfig
 * @property {string} [username]
 * @property {string} [ip]
 * @property {string} [uuid]
 * @property {string} [signature]
 * @property {string} [accessToken]
 */

/**
 * @param {ParseFromRequestConfig} config
 * @returns {UsersRouteGetParameters}
 */
function parseFromRequest(config)
{
    /**
     * @type {ParseFromRequestConfig}
     */
    const defaults = {
        username: undefined,
        ip: undefined,
        uuid: undefined,
        signature: undefined,
        accessToken: undefined
    };
    config = { ...defaults, ...config };

    let request = mockRequest.createFullRequest(
        "get",
        "/user",
        config.ip,
        config.uuid,
        config.signature,
        {},
        {},
        config.username === undefined ? {} : {
            username: config.username
        },
        config.accessToken === undefined ? {} : {
            "Crnlg-Access-Token": config.accessToken
        }
    );

    return UsersRouteGetParameters.parse(request);
}

/**
 * @param {UsersRouteGetParameters} params
 * @param {string} errorToMatch
 */
async function tryAndExpectError(params, errorToMatch)
{
    await expect(params.validate()).rejects.toThrow(errorToMatch);
}

test("constructor / setAll / set", () => {
    let params = new UsersRouteGetParameters({});
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: null });
    expect(() => params.app).toThrow("populate");
    expect(() => params.user).toThrow("populate");

    params = new UsersRouteGetParameters({
        username: ""
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "" });

    params = new UsersRouteGetParameters({
        username: "test",
        foo: "bar"
    });
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "test" });

    expect(params.setAll({
        username: "aa"
    })).toBe(true);
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "aa" });

    expect(params.setAll({
        foo: "bar",
        baz: "foo"
    })).toBe(false);
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "aa" });

    expect(params.setAll({
        username: "username",
        foo: "foo"
    })).toBe(false);
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "username" });

    expect(params.set("username", "tst")).toBe(true);
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "tst" });

    expect(params.set("foo", 12)).toBe(false);
    expect(params.authentication).toStrictEqual({});
    expect(params.toObject()).toStrictEqual({ username: "tst" });
});

test("parse", () => {
    let params = parseFromRequest({});
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: "",
        signature: "",
        accessToken: null
    });
    expect(params.toObject()).toStrictEqual({ username: "" });
    expect(() => params.app).toThrow("authenticator: 0");
    expect(() => params.user).toThrow("authenticator: 0");

    params = parseFromRequest({
        username: "test"
    });
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: "",
        signature: "",
        accessToken: null
    });
    expect(params.toObject()).toStrictEqual({ username: "test" });

    params = parseFromRequest({
        username: "test",
        accessToken: "access-token"
    });
    expect(params.authentication).toStrictEqual({
        ip: "127.0.0.1",
        uuid: "",
        signature: null,
        accessToken: "access-token"
    });
    expect(params.toObject()).toStrictEqual({ username: null });

    params = parseFromRequest({
        username: "test",
        ip: "::1"
    });
    expect(params.authentication).toStrictEqual({
        ip: "::1",
        uuid: "",
        signature: "",
        accessToken: null
    });
    expect(params.toObject()).toStrictEqual({ username: "test" });

    params = parseFromRequest({
        username: "test",
        ip: "::1",
        uuid: "uuid"
    });
    expect(params.authentication).toStrictEqual({
        ip: "::1",
        uuid: "uuid",
        signature: "",
        accessToken: null
    });
    expect(params.toObject()).toStrictEqual({ username: "test" });

    params = parseFromRequest({
        username: "test",
        ip: "::1",
        uuid: "uuid",
        signature: "signature"
    });
    expect(params.authentication).toStrictEqual({
        ip: "::1",
        uuid: "uuid",
        signature: "signature",
        accessToken: null
    });
    expect(params.toObject()).toStrictEqual({ username: "test" });

    params = parseFromRequest({
        username: "test",
        ip: "::1",
        uuid: "uuid",
        signature: "signature",
        accessToken: "access-token"
    });
    expect(params.authentication).toStrictEqual({
        ip: "::1",
        uuid: "uuid",
        signature: null,
        accessToken: "access-token"
    });
    expect(params.toObject()).toStrictEqual({ username: null });
});

test("validate", async () => {
    let params = parseFromRequest({});
    await tryAndExpectError(params, "invalid application");

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid
    });
    await tryAndExpectError(params, "invalid signature");
    expect(params.app).toBeInstanceOf(ExternalApplication);
    expect(() => params.user).toThrow("authenticator: 0");

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        accessToken: user.accessToken
    });
    expect(await params.validate()).toBe(true);
    expect(params.app).toBeInstanceOf(ExternalApplication);
    expect(params.user).toBeInstanceOf(User);
    expect(params.toObject()).toStrictEqual({ username: null });

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        accessToken: user.accessToken,
        username: "test"
    });
    expect(await params.validate()).toBe(true);
    expect(params.app).toBeInstanceOf(ExternalApplication);
    expect(params.user).toBeInstanceOf(User);
    expect(params.toObject()).toStrictEqual({ username: null });

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        username: user.username,
        signature: await app.generateSignature({
            username: user.username,
            ip: "::1"
        })
    });
    expect(await params.validate()).toBe(true);

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        signature: await app.generateSignature({
            username: "",
            ip: "::1"
        })
    });
    await tryAndExpectError(params, "username");

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        username: "a",
        signature: await app.generateSignature({
            username: "a",
            ip: "::1"
        })
    });
    expect(await params.validate()).toBe(true);

    params = parseFromRequest({
        ip: "::1",
        uuid: app.uuid,
        signature: await app.generateSignature({
            username: "",
            ip: "::1"
        }),
        accessToken: user.accessToken
    });
    expect(await params.validate()).toBe(true);
});