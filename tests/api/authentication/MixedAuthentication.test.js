"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { MixedAuthentication, AppAuthentication, UserValidation, AppValidation } = require("../../../src/api/authentication");
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
 * @type {ExternalApplication}
 */
let appSecondary;
/**
 * @type {User}
 */
let user;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("MixedAuthentication.test");

    await db.connect();

    app = new ExternalApplication({
        name: "MixedAuthentication-test"
    });
    await app.generateKeys();
    await app.save();

    appSecondary = new ExternalApplication({
        name: "MixedAuthentication-secondary-test"
    });
    await appSecondary.generateKeys();
    await appSecondary.save();

    user = await UserRepository.createRandom();
});

afterAll(async () => {
    app.deleteKeys();
    appSecondary.deleteKeys();
    await db.tearDown();
});

/**
 * @param {string|undefined} [ip]
 * @param {string|undefined} [uuid]
 * @param {string|undefined} [signature]
 * @param {string|undefined} [accessToken]
 * @returns {MixedAuthentication}
 */
function parseRequest(ip = undefined, uuid = undefined, signature = undefined, accessToken = undefined)
{
    let req = mockRequest.createFullRequest(
        "get",
        "/",
        ip,
        uuid,
        signature,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": accessToken
        }
    );

    return MixedAuthentication.parse(req);
}

/**
 * @param {MixedAuthentication} params
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

test("constructor", () => {
    let result = new MixedAuthentication({});
    expect(result.toObject()).toStrictEqual({
        ip: null,
        uuid: null,
        signature: null,
        accessToken: null
    });
    expect(result.app).toBeNull();
    expect(result.user).toBeNull();
});

test("parse / toObject", () => {
    let result = parseRequest();
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "127.0.0.1",
            uuid: "",
            signature: ""
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "127.0.0.1",
        uuid: "",
        signature: "",
        accessToken: null
    });

    result = parseRequest("::1");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "::1",
            uuid: "",
            signature: ""
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "",
        signature: "",
        accessToken: null
    });

    result = parseRequest("::1", "test");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "::1",
            uuid: "test",
            signature: ""
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "test",
        signature: "",
        accessToken: null
    });

    result = parseRequest("::1", "test", undefined, "test2");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appValidation: new AppValidation({
            ip: "::1",
            uuid: "test"
        }),
        userValidation: new UserValidation({
            accessToken: "test2"
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "test",
        signature: null,
        accessToken: "test2"
    });

    result = parseRequest("::1", "test", "signature", "test2");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appValidation: new AppValidation({
            ip: "::1",
            uuid: "test"
        }),
        userValidation: new UserValidation({
            accessToken: "test2"
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "test",
        signature: null,
        accessToken: "test2"
    });

    result = parseRequest(undefined, undefined, "signature");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "127.0.0.1",
            uuid: "",
            signature: "signature"
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "127.0.0.1",
        uuid: "",
        signature: "signature",
        accessToken: null
    });

    result = parseRequest("::1", undefined, "signature");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "::1",
            uuid: "",
            signature: "signature"
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "",
        signature: "signature",
        accessToken: null
    });

    result = parseRequest("::1", "uuid", "signature");
    expect(result).toBeInstanceOf(MixedAuthentication);
    expect(result).toStrictEqual(new MixedAuthentication({
        appAuthentication: new AppAuthentication({
            ip: "::1",
            uuid: "uuid",
            signature: "signature"
        })
    }));
    expect(result.toObject()).toStrictEqual({
        ip: "::1",
        uuid: "uuid",
        signature: "signature",
        accessToken: null
    });
});

test("validate", async () => {
    let result = parseRequest();
    await tryAndExpectError(result, "invalid application");

    result = parseRequest("");
    await tryAndExpectError(result, "invalid IP");
    expect(result.app).toBe(null);
    expect(result.user).toBe(null);

    result = parseRequest("::1");
    await tryAndExpectError(result, "invalid application");
    expect(result.app).toBe(null);
    expect(result.user).toBe(null);

    result = parseRequest(undefined, "aaaa");
    await tryAndExpectError(result, "invalid application");
    expect(result.app).toBe(null);
    expect(result.user).toBe(null);

    result = parseRequest("", "aaaa");
    await tryAndExpectError(result, "invalid IP");
    expect(result.app).toBe(null);
    expect(result.user).toBe(null);

    result = parseRequest("::2", "aaaa");
    await tryAndExpectError(result, "invalid application");
    expect(result.app).toBe(null);
    expect(result.user).toBe(null);

    result = parseRequest("::2", app.uuid);
    await tryAndExpectError(result, "permission");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid);
    await tryAndExpectError(result, "signature");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid, undefined, "aaaa");
    await tryAndExpectError(result, "user could not");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid, undefined, user.accessToken);
    expect(await result.validate()).toBe(true);
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBeInstanceOf(User);

    result = parseRequest("::1", appSecondary.uuid, undefined, user.accessToken);
    expect(await result.validate()).toBe(true);
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBeInstanceOf(User);

    result = parseRequest("::1", app.uuid, "aaa", user.accessToken);
    expect(await result.validate()).toBe(true);
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBeInstanceOf(User);

    result = parseRequest("::1", app.uuid, await app.generateSignature({
        ip: "::1"
    }), "invalid access token");
    await tryAndExpectError(result, "accessToken");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid, await app.generateSignature({
        ip: "::1"
    }));
    expect(await result.validate()).toBe(true);
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::2", app.uuid, await app.generateSignature({
        ip: "::1"
    }));
    await tryAndExpectError(result, "permission");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid, await app.generateSignature({
        ip: "::2"
    }));
    await tryAndExpectError(result, "permission");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", appSecondary.uuid, await app.generateSignature({
        ip: "::1"
    }));
    await tryAndExpectError(result, "permission");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);

    result = parseRequest("::1", app.uuid, await appSecondary.generateSignature({
        ip: "::1"
    }));
    await tryAndExpectError(result, "permission");
    expect(result.app).toBeInstanceOf(ExternalApplication);
    expect(result.user).toBe(null);
});