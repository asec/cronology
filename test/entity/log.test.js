"use strict";
require("../../config/dotenv").environment("test");
const { test, expect, afterEach, afterAll } = require("@jest/globals");
const {Log} = require("../../model");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const logPath = path.resolve(process.env.CONF_LOG_DIR || "./test/logs/");
let db;

afterEach(() => {
    fs.rmSync(logPath, {
        recursive: true,
        force: true
    });
});

afterAll(async () => {
    if (db.readyState !== 1)
    {
        await db.openUri(process.env.CONF_DB_URI);
    }
    await db.dropDatabase();
    await db.close();
});

function getLineCount(file)
{
    return new Promise((resolve, reject) => {
        let count = 0;
        fs.createReadStream(file)
            .on("data", chunk => {
                for (let i = 0; i < chunk.length; i++)
                {
                    if (chunk[i] === 10)
                    {
                        count++;
                    }
                }
            })
            .on("end", () => {
                resolve(count);
            })
            .on("error", reject)
        ;
    });
}

test("log", async () => {
    let logFileName = "test-" + Math.round(Math.random() * 10000);
    Log.setLogFile(logFileName);
    await Log.log("test", "valami", {a: "b"});
    let files = fs.readdirSync(logPath);

    expect(files).toContain(logFileName);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(1);

    await Log.log("error", "Second one");
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(2);

    db = await require("../../utils/db");
    expect(db.readyState).toBe(1);

    let log = await Log.log("warning", "Harmadik", {aaa: "b \n bb", ccc: 12, d: {a:"b",c:"d"}});

    expect(await getLineCount(logPath + "/" + logFileName)).toBe(3);
    expect(await Log.countDocuments()).toBe(3);
    expect(typeof log.__v).not.toBeUndefined();

    Log.log("success", "Valami teszt", log);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(3);
    expect(await Log.countDocuments()).toBe(4);

    await db.close();
    Log.log("success", "Valami\n teszt 2", log);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(4);
});