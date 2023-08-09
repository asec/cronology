"use strict";
require("../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");

let db;

beforeAll(async () => {
    db = await require("../utils/db");
});

afterAll(async () => {
    await db.close();
});

test("Connection", async () => {
    expect(db.readyState).toBe(1);
});