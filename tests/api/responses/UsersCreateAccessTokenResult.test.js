"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { UsersCreateAccessTokenResult } = require("../../../src/api/responses");
const { User } = require("../../../src/model/User");

test("constructor", () => {
    let result = new UsersCreateAccessTokenResult({});
    let now = new Date();
    expect(result.toObject()).toStrictEqual({ success: false, result: null });

    result = new UsersCreateAccessTokenResult({
        success: true,
        result: {
            username: "a",
            accessToken: "b",
            accessTokenValid: now
        }
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        result: {
            username: "a",
            accessToken: "b",
            accessTokenValid: now
        }
    });

    result = new UsersCreateAccessTokenResult({
        success: true,
        result: {
            foo: "bar"
        }
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        result: {
            username: "",
            accessToken: "",
            accessTokenValid: null
        }
    });

    let user = new User({
        username: "test",
        password: "test2",
        isAdmin: true,
        loginDate: new Date()
    });
    user.createNewAccessToken();
    result = new UsersCreateAccessTokenResult({
        success: true,
        result: user.toObject()
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        result: {
            username: user.username,
            accessToken: user.accessToken,
            accessTokenValid: user.accessTokenValid
        }
    });
});