"use strict";
require("../config/dotenv").environment("test");
const { test, expect, afterAll, beforeEach} = require("@jest/globals");
const Log = require("../model/Log/Log.model");
const db = require("../utils/db/class");

const defaultEnvironmentVariables = {...process.env};
beforeEach(() => {
    jest.resetModules();
    process.env = {...defaultEnvironmentVariables};
});

afterAll(() => {
    process.env = defaultEnvironmentVariables;
});

test("Missing db uri", async () => {
    require("../config/dotenv").environment("test");

    const currentDbUri = process.env.CONF_DB_URI;
    process.env.CONF_DB_URI = "";
    const db = require("./db");
    await expect(async () => db.connect()).rejects.toThrow();
});

test("Connection", async () => {
    require("../config/dotenv").environment("test");

    const db = require("./db");

    await db.connect();

    expect(db.getReadyState()).toBe(1);

    await db.tearDown();

    expect(db.getReadyState()).toBe(0);
});

test("Generate error", async () => {
    require("../config/dotenv").environment("test");

    process.env.CONF_DB_URI = "mongodb://127.0.0.1:27018/cronology-test";
    const db = require("./db");

    db.on("error", async () => {
        await db.disconnect();
        Log.tearDown();
    });

    await expect(async () => db.connect()).rejects.toThrow();
    await new Promise(resolve => setTimeout(() => resolve(true), 200));
});

test("Test: disconnect timer", async () => {
    require("../config/dotenv").environment("test");

    const db = require("./db");

    await new Promise(resolve => {
        db.connect();
        setTimeout(() => resolve(true), 1);
    });
    await db.waitForConnectionStateChange();

    await db.tearDown();
});