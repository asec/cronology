"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { ApiResponse } = require("../../../src/api/responses/ApiResponse.class");
const { Log } = require("../../../src/model/Log");
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

test("constructor", () => {
    let response = new ApiResponse();
    expect(response.toObject()).toStrictEqual({ success: false });

    response = new ApiResponse({
        success: true
    });
    expect(response.toObject()).toStrictEqual({ success: true });

    response = new ApiResponse({
        success: true,
        invalid: "noop"
    });
    expect(response.toObject()).toStrictEqual({ success: true });
});

test("set", () => {
    let response = new ApiResponse();
    expect(response.set("success", true)).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: true });

    expect(response.set("invalid", "teszt")).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: true });

    expect(response.setAll({ success: false })).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false });

    expect(response.setAll({ success: true, invalid: "aaaa" })).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: true });
});

test("sanitizeDbObject", async () => {
    let response = new ApiResponse({
        success: true
    });
    expect(response.sanitizeDbObject({})).toStrictEqual({});
    expect(response.sanitizeDbObject({foo: "bar", bar: 42})).toStrictEqual({foo: "bar", bar: 42});
    expect(response.sanitizeDbObject(response.toObject())).toStrictEqual(response.toObject());

    let obj = {
        _id: "test",
        name: "test-object"
    };
    expect(response.sanitizeDbObject(obj)).toStrictEqual({ id: "test", name: "test-object" });

    obj = {
        _id: "test",
        name: "test-object",
        __v: 10,
        _v: 11,
        v: 12
    };
    expect(response.sanitizeDbObject(obj)).toStrictEqual({ id: "test", name: "test-object", _v: 11, v: 12 });

    let log = await Log.log("test", "label");
    expect(response.sanitizeDbObject(log)).toStrictEqual({});
    expect(response.sanitizeDbObject(log.toObject())).toStrictEqual({ type: "test", label: "label", id: String(log.id), "section": "" });

    await db.connect();

    log = await Log.log("success", "Test message");
    expect(response.sanitizeDbObject(log)).toStrictEqual({});
    expect(response.sanitizeDbObject(log.toObject())).toStrictEqual({
        type: "success",
        label: "Test message",
        id: String(log.id),
        created: log.created,
        section: ""
    });
});