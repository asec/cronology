"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { UsersCreateUser } = require("../../../src/api/responses/UsersCreateUser.class");
const { User } = require("../../../src/model/User");
const db = require("../../db");

beforeAll(() => {
    env.enableSilentLogging();
});

afterAll(async () => {
    if (db.getReadyState() !== 1)
    {
        await db.connect();
    }

    await db.tearDown();
});

test("constructor", async () => {
    let result= new UsersCreateUser({});
    expect(result.toObject()).toStrictEqual({ success: false, result: null });

    result = new UsersCreateUser({
        success: true
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: null });

    /**
     * @type {UserBean}
     */
    let userBean = {
        username: "a",
        password: 2,
        isAdmin: false,
        loginDate: "b",
        accessTokenValid: "c",
        accessToken: "d"
    };
    result = new UsersCreateUser({
        success: true,
        result: userBean
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: userBean });

    userBean._id = "teszt";
    userBean.__v = 10;
    expect(result.toObject()).toStrictEqual({ success: true, result: {
        username: "a",
        isAdmin: false,
        loginDate: "b",
        accessTokenValid: "c",
        accessToken: "d",
        id: "teszt"
    } });

    let now = new Date();
    let user = new User({
        username: "teszt",
        password: "aaaaaaaaaA1$",
        isAdmin: true,
        accessToken: "b",
        accessTokenValid: now,
        loginDate: now
    });
    result = new UsersCreateUser({
        success: true,
        result: user.toObject()
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        result: {
            username: "teszt",
            isAdmin: true,
            accessToken: "b",
            accessTokenValid: now,
            loginDate: now,
            id: String(user.id)
        }
    });

    await db.connect();
    await user.save();

    result = new UsersCreateUser({
        success: true,
        result: user.toObject()
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        result: {
            username: "teszt",
            isAdmin: true,
            accessToken: "b",
            accessTokenValid: now,
            loginDate: now,
            created: user.created,
            updated: user.updated,
            id: String(user.id)
        }
    });
});