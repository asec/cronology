"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, afterEach, beforeAll } = require("@jest/globals");
const { Log, LogRepository } = require("../../src/model/Log");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const mongoose = require("mongoose");

process.env.CONF_LOG_DIR = "./tests/logs-with-teardown/";
const logPath = path.resolve(process.env.CONF_LOG_DIR || "./tests/logs/");

beforeAll(() => {
    env.enableSilentLogging();
});

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

/**
 * @returns {Promise<Log>}
 */
async function getLastLogLineFromDb()
{
    return new Log((await LogRepository.model.find({}).sort({ created: -1, _id: -1 }).limit(1))[0]);
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

test("section / pullFromFile", async () => {
    await db.connect();
    let section1 = await Log.startSection("test");
    expect(section1).toBeInstanceOf(Log);
    expect(typeof section1.toObject().section).toBe("string");
    expect(section1.toObject().type).toBe("section");
    expect(section1.toObject().label).toBe("test");

    await Log.log("info", "test log line");
    /**
     * @type {LogBean[]}
     */
    let logs = await LogRepository.model.find({}).sort({ created: -1, _id: -1 });
    for (let i = 0; i < logs.length; i++)
    {
        if (logs[i].section)
        {
            expect(logs[i].section).toBe(section1.toObject().section);
        }
    }

    Log.endSection();
    let log = await Log.log("test", "log line without section");
    expect(log.toObject().section).toBe("");

    let section2 = await Log.startSection("new section");
    await Log.log("test", "new line into new section");
    log = await getLastLogLineFromDb();
    expect(log.toObject().section).not.toBe(section1.toObject().section);
    expect(log.toObject().section).toBe(section2.toObject().section);
    await Log.log("test", "second new line into new section");
    log = await getLastLogLineFromDb();
    expect(log.toObject().section).not.toBe(section1.toObject().section);
    expect(log.toObject().section).toBe(section2.toObject().section);

    let section3 = await Log.startSection("section 3");
    await Log.log("test", "third section");
    log = await getLastLogLineFromDb();
    expect(log.toObject().section).not.toBe(section1.toObject().section);
    expect(log.toObject().section).not.toBe(section2.toObject().section);
    expect(log.toObject().section).toBe(section3.toObject().section);

    const linesInDb = await LogRepository.countDocuments();
    const linesInFile = await getLineCount(logPath + "/" + Log.getLogFile());
    const linesPulled = await Log.pullFromFile();
    expect(await LogRepository.countDocuments()).toBe(linesInDb + linesPulled);
    expect(linesInFile).toBeGreaterThanOrEqual(linesPulled);
});