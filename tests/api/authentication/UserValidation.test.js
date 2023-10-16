const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { UserValidation } = require("../../../src/api/authentication");
const { UserRepository } = require("../../entity/repository/User.repository");
const { Log } = require("../../../src/model/Log");

const mockRequest = require("../../_mock/request");
const db = require("../../db");
const { User } = require("../../../src/model/User");

/**
 * @type {User}
 */
let user;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("UserValidation.test");

    await db.connect();

    user = await UserRepository.createRandom();
    user.createNewAccessToken();

    await user.save();
});

afterAll(async () => {
    await db.tearDown();
});

/**
 * @param {UserValidation} params
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

test("constructor / setAll / set", () => {
    let auth = new UserValidation({});
    expect(auth.toObject()).toStrictEqual({ accessToken: "" });

    auth = new UserValidation({
        accessToken: "test"
    });
    expect(auth.toObject()).toStrictEqual({ accessToken: "test" });

    auth = new UserValidation({
        accessToken: "aa",
        foo: "bar",
        baz: 12
    });
    expect(auth.toObject()).toStrictEqual({ accessToken: "aa" });

    auth = new UserValidation({
        accessToken: 12
    });
    expect(auth.toObject()).toStrictEqual({ accessToken: 12 });

    auth = new UserValidation({
        accessToken: new Date()
    });
    expect(auth.toObject().accessToken).toBeInstanceOf(Date);

    expect(auth.setAll({
        accessToken: "token"
    })).toBe(true);
    expect(auth.toObject()).toStrictEqual({ accessToken: "token" });

    expect(auth.setAll({
        accessToken: 42
    })).toBe(true);
    expect(auth.toObject()).toStrictEqual({ accessToken: 42 });

    expect(auth.setAll({
        accessToken: "token",
        foo: "bar"
    })).toBe(false);
    expect(auth.toObject()).toStrictEqual({ accessToken: "token" });

    expect(auth.set("accessToken", "second")).toBe(true);
    expect(auth.toObject()).toStrictEqual({ accessToken: "second" });

    expect(auth.set("bar", 42)).toBe(false);
    expect(auth.toObject()).toStrictEqual({ accessToken: "second" });

    expect(auth.set("accessToken", 42)).toBe(true);
    expect(auth.toObject()).toStrictEqual({ accessToken: 42 });
});

test("parse", () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined
    );
    let auth = UserValidation.parse(req);
    expect(auth.toObject()).toStrictEqual({ accessToken: "" });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": "test"
        }
    );
    auth = UserValidation.parse(req);
    expect(auth.toObject()).toStrictEqual({ accessToken: "test" });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": 12,
            "Crnlg-App": "aaa"
        }
    );
    auth = UserValidation.parse(req);
    expect(auth.toObject()).toStrictEqual({ accessToken: 12 });

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": new Date()
        }
    );
    auth = UserValidation.parse(req);
    expect(auth.toObject().accessToken).toBeInstanceOf(Date);
});

test("validate", async () => {
    let req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined
    );
    let auth = UserValidation.parse(req);
    await tryAndExpectError(auth, "accessToken");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": ""
        }
    );
    auth = UserValidation.parse(req);
    await tryAndExpectError(auth, "accessToken");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": 12
        }
    );
    auth = UserValidation.parse(req);
    await tryAndExpectError(auth, "accessToken");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": "aaa"
        }
    );
    auth = UserValidation.parse(req);
    await tryAndExpectError(auth, "user");

    req = mockRequest.createFullRequest(
        "post",
        "/",
        undefined,
        undefined,
        undefined,
        {},
        {},
        {},
        {
            "Crnlg-Access-Token": user.accessToken
        }
    );
    auth = UserValidation.parse(req);
    expect(await auth.validate()).toBe(true);
    expect(auth.user).toBeInstanceOf(User);
});