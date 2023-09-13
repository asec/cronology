"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, afterEach, afterAll } = require("@jest/globals");
const { Log, LogRepository } = require("../../src/model/Log");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const mongoose = require("mongoose");

process.env.CONF_LOG_DIR = "./tests/logs-with-teardown/";
const logPath = path.resolve(process.env.CONF_LOG_DIR || "./tests/logs/");

afterEach(async () => {
    if (db.getReadyState() !== 1)
    {
        await db.connect();
    }
    await db.tearDown();
});

function getLineCount(file)
{
    return new Promise((resolve, reject) => {
        let count = 0;
        if (!fs.existsSync(file))
        {
            resolve(-1);
        }
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
    expect(Log.getLogFile()).not.toBe(logFileName);
    Log.setLogFile(logFileName);
    expect(Log.getLogFile()).toBe(logFileName);

    env.disableLogging();
    expect(await Log.log("info", "first test")).toBe(false);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(-1);
    env.enableLogging();

    let log = await Log.log("test", "valami", {"a": "b"});
    expect(log.type).toBe("test");
    expect(log.label).toBe("valami");
    expect(log.data).toStrictEqual({a:"b"});
    expect(log.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(log.created).toBeUndefined();
    let files = fs.readdirSync(logPath);

    expect(files).toContain(logFileName);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(1);

    await Log.log("error", "Second one");
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(2);

    await db.connect();
    expect(db.getReadyState()).toBe(1);

    log = await Log.log("warning", "Harmadik", {aaa: "b \n bb", ccc: 12, d: {a:"b",c:"d"}});
    expect(log.type).toBe("warning");
    expect(log.label).toBe("Harmadik");
    expect(log.data.ccc).toBe(12);
    expect(log.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(log.created).toBeInstanceOf(Date);

    expect(await getLineCount(logPath + "/" + logFileName)).toBe(3);
    expect(await LogRepository.countDocuments()).toBe(3);
    expect(typeof log.__v).not.toBeUndefined();

    await Log.log("success", "Valami teszt", log);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(3);
    expect(await LogRepository.countDocuments()).toBe(4);

    env.disableLogging();
    expect(await Log.log("success2", "Last hurray", null)).toBe(false);
    expect(await LogRepository.countDocuments()).toBe(4);
    env.enableLogging();

    await db.disconnect();
    await Log.log("success", "Valami\n teszt 2", log);
    expect(await getLineCount(logPath + "/" + logFileName)).toBe(4);
});

test("tearDown", async () => {
    let logFileName = "test-" + Math.round(Math.random() * 10000);
    Log.setLogFile(logFileName);
    await db.connect();

    await Log.log("a", "b");

    let files = fs.readdirSync(logPath);
    expect(files).toContain(logFileName);

    expect(await LogRepository.countDocuments()).toBe(3);

    const currentEnv = process.env.APP_ENV;
    process.env.APP_ENV = "dev";

    await expect(LogRepository.truncate()).rejects.toThrow();
    expect(await LogRepository.countDocuments()).toBe(0);

    process.env.APP_ENV = currentEnv;

    await expect(LogRepository.truncate()).resolves.not.toThrow();
    let dirExists = fs.existsSync(logPath);
    if (dirExists)
    {
        files = fs.readdirSync(logPath);
        expect(files).not.toContain(logFileName);
    }
});