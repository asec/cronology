"use strict";
require("../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");

const db = require("./db");

test("Connection", async () => {

    await db.connect();

    expect(db.getReadyState()).toBe(1);

    await db.tearDown();

    expect(db.getReadyState()).toBe(0);
});