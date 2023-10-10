"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { UserAccessTokenBean } = require("../../../src/api/datastructures/UserAccessTokenBean.class");
const { User } = require("../../../src/model/User");

test("constructor", () => {
    let entity = new UserAccessTokenBean({});
    expect(entity.toObject()).toStrictEqual({
        username: "",
        accessToken: "",
        accessTokenValid: null
    });

    let now = new Date();
    entity = new UserAccessTokenBean({
        username: "test",
        accessToken: "token",
        accessTokenValid: now,
        foo: "bar"
    })
    expect(entity.toObject()).toStrictEqual({
        username: "test",
        accessToken: "token",
        accessTokenValid: now
    });

    let user = new User({
        username: "test",
        password: "test2",
        isAdmin: true,
        loginDate: new Date()
    });
    user.createNewAccessToken();
    entity = new UserAccessTokenBean(user.toObject());
    expect(entity.toObject()).toStrictEqual({
        username: user.username,
        accessToken: user.accessToken,
        accessTokenValid: user.accessTokenValid
    });
});