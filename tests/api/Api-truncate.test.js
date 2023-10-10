"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { Log, LogRepository } = require("../../src/model/Log");
const { ExternalApplication } = require("../../src/model/ExternalApplication");
const { Api } = require("../../src/api/Api.class");
const { ApiResponse } = require("../../src/api/responses");

const db = require("../db");

/**
 * @type {ExternalApplication};
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("test-Api-truncate.test");
    await db.connect();
    await Api.init();

    app = new ExternalApplication({
        name: "Api-test-truncate"
    });
    await app.generateKeys();
    await app.save();
});

afterAll(async () => {
    if (db.getReadyState() !== 1)
    {
        await db.connect();
    }
    app.deleteKeys();
    await db.tearDown();
});

test("execute: DefaultRoute::truncate", async () => {
    expect.assertions(4);
    expect(await LogRepository.countDocuments()).toBeGreaterThanOrEqual(2);
    let response = await Api.execute("delete", "/");
    expect(response).toBeInstanceOf(ApiResponse);
    expect(response.toObject()).toStrictEqual({ success: true });
    expect(await LogRepository.countDocuments()).toBe(0);
});