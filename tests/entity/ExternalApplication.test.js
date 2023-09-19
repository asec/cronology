"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll, afterEach} = require("@jest/globals");
const { ExternalApplication, ExternalApplicationRepository } = require("../../src/model/ExternalApplication");
const validator = require("validator");
const db = require("../db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

beforeAll(async () => {
    env.enableSilentLogging();
    process.env.CONF_CRYPTO_APPKEYS += crypto.randomUUID() + "/";
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
    env.disableSilentLogging();
});

afterEach(async () => {
    await ExternalApplicationRepository.truncate();
});

/**
 * @param {string} [name]
 * @param {string} [uuid]
 * @returns {ExternalApplication}
 */
function createApp(name = undefined, uuid = undefined)
{
    let app = new ExternalApplication();
    if (name)
    {
        app.name = name;
    }
    if (uuid)
    {
        app.uuid = uuid;
    }

    return app;
}

class TestNonString
{
    toString()
    {
        return 16;
    }
}

/**
 * @param {ExternalApplication} app
 */
function deleteAppKeys(app)
{
    app.deleteKeys();
}

test("constructor", () => {
    let app = new ExternalApplication();
    expect(app.id).not.toBeUndefined();
    expect(app.name).toBeUndefined();
    expect(app.uuid).not.toBeUndefined();
    expect(app.ip).toStrictEqual([]);
    expect(app.created).toBeUndefined();
    expect(app.updated).toBeUndefined();

    app = new ExternalApplication({
        name: "test app"
    });
    expect(app.id).not.toBeUndefined();
    expect(app.name).toBe("test app");
    expect(app.uuid).not.toBeUndefined();
    expect(app.ip).toStrictEqual([]);
    expect(app.created).toBeUndefined();
    expect(app.updated).toBeUndefined();

    app = new ExternalApplication({
        name: "test",
        uuid: "test3"
    });
    expect(app.id).not.toBeUndefined();
    expect(app.name).toBe("test");
    expect(app.uuid).toBe("test3");
    expect(app.ip).toStrictEqual([]);
    expect(app.created).toBeUndefined();
    expect(app.updated).toBeUndefined();

    app = new ExternalApplication({
        name: "test",
        uuid: "test3",
        ip: ["127.0.0.1"]
    });
    expect(app.id).not.toBeUndefined();
    expect(app.name).toBe("test");
    expect(app.uuid).toBe("test3");
    expect(app.ip).toStrictEqual(["127.0.0.1"]);
    expect(app.created).toBeUndefined();
    expect(app.updated).toBeUndefined();

    app.name = "test2";
    app.uuid = "12";
    expect(app.name).toBe("test2");
    expect(app.uuid).toBe("12");
    expect(app.ip).toStrictEqual(["127.0.0.1"]);
    expect(app.created).toBeUndefined();
    expect(app.updated).toBeUndefined();
});

test("generateUuid", () => {
    let uuidRegex = /^[0-9abcdef]{8}-[0-9abcdef]{4}-[0-9abcdef]{4}-[0-9abcdef]{4}-[0-9abcdef]{12}$/;
    let app = createApp("test", undefined, false);
    let uuid = app.generateUuid();
    expect(app.uuid).toBe(uuid);
    expect(validator.matches(app.uuid, uuidRegex)).toBe(true);

    app.generateUuid();
    expect(app.uuid).not.toBe(uuid);
    expect(validator.matches(app.uuid, uuidRegex)).toBe(true);
});

test("ip", () => {
    let app = createApp("test-app");
    expect(app.ip).toStrictEqual([]);

    const badIps = [
        undefined,
        10,
        new Date(),
        Date,
        "",
        null,
        "aaaaaa",
        "255.",
        "255.255.",
        "255.255.255",
        "255.255.255.255.",
        "256.0.0.1",
        "255.0.0.1.",
        "255.0.0.01",
        "2001a:4c4e:1e5b:c800:ee06:630d:8737:97d1"
    ];
    for (let i = 0; i < badIps.length; i++)
    {
        expect(app.addIp(badIps[i])).toBe(false);
    }
    expect(app.ip).toStrictEqual([]);

    app.addIp("127.0.0.1");
    app.addIp("198.162.2.1");
    expect(app.ip).toStrictEqual(["127.0.0.1", "198.162.2.1"]);
    expect(app.hasIp("127.0.0.1")).toBe(true);
    expect(app.hasIp("156.145.85.10")).toBe(false);

    expect(app.removeIp("127.0.0.1")).toBe(true);
    expect(app.ip).toStrictEqual(["198.162.2.1"]);
    expect(app.removeIp("198.162.2.2")).toBe(false);
    expect(app.ip).toStrictEqual(["198.162.2.1"]);
    expect(app.removeIp("198.162.2.1")).toBe(true);
    expect(app.ip).toStrictEqual([]);
    expect(app.removeIp("198.162.2.1")).toBe(false);
    expect(app.ip).toStrictEqual([]);
});

test("validate", async () => {
    let app = createApp(undefined, undefined);
    await expect(app.validate()).rejects.toThrow();

    app.name = "test";

    await expect(app.validate()).resolves.not.toThrow();

    const badUsernames = [
        "",
        12,
        "test 2",
        "a",
        null,
        new Date(),
        Date,
        "1a2aaaaa",
        new TestNonString()
    ];
    for (let i = 0; i < badUsernames.length; i++)
    {
        app.name = badUsernames[i];
        await expect(app.validate()).rejects.toThrow();
    }

    app.name = "test";
    const badUuids = [
        "",
        null,
        undefined
    ];
    for (let i = 0; i < badUuids.length; i++)
    {
        app.uuid = badUuids[i];
        await expect(app.validate()).rejects.toThrow();
    }
});

test("Create", async () => {
    let app = createApp("test-app");

    await expect(app.save()).resolves.not.toThrow();
    expect(await ExternalApplicationRepository.countDocuments()).toBe(1);

    let secondApp = createApp("test-app");
    await expect(secondApp.save()).rejects.toThrow();

    secondApp.name = "test-app2";
    secondApp.uuid = app.uuid;
    await expect(secondApp.save()).rejects.toThrow();

    secondApp.generateUuid();
    await expect(secondApp.save()).resolves.not.toThrow();
    expect(await ExternalApplicationRepository.countDocuments()).toBe(2);
});

test("Read", async () => {
    let app = createApp("test-app");
    await expect(app.save()).resolves.not.toThrow();
    expect(await ExternalApplicationRepository.countDocuments()).toBe(1);

    let appCopy = await ExternalApplicationRepository.findOne({ name: "test-app" });
    expect(app.toObject()).toStrictEqual(appCopy.toObject());

    expect(await ExternalApplicationRepository.findOne({ name: "tst" })).toBeNull();
});

test("Update", async () => {
    let app = createApp("test-app");
    await app.save();

    let secondApp = createApp("test-app2");
    await secondApp.save();

    expect(await ExternalApplicationRepository.countDocuments()).toBe(2);

    secondApp.name = "test-app-3";
    await secondApp.save();

    expect(
        (await ExternalApplicationRepository.findOne({ name: "test-app-3" })).toObject()
    ).toStrictEqual(secondApp.toObject());

    app.name = secondApp.name;
    await expect(app.save()).rejects.toThrow();

    app.name = "test-app2";
    app.uuid = secondApp.uuid;
    await expect(app.save()).rejects.toThrow();

    app.generateUuid();
    await expect(app.save()).resolves.not.toThrow();

    expect(await ExternalApplicationRepository.countDocuments()).toBe(2);
});

test("Delete", async () => {
    await ExternalApplicationRepository.insertMany([
        createApp("test-app"),
        createApp("test-app-2"),
        {
            name: "test-app-3",
            uuid: "test"
        }
    ]);

    expect(await ExternalApplicationRepository.countDocuments()).toBe(3);

    await ExternalApplicationRepository.deleteOne({ name: "test-app-2" });

    expect(await ExternalApplicationRepository.countDocuments()).toBe(2);

    await ExternalApplicationRepository.deleteMany();

    expect(await ExternalApplicationRepository.countDocuments()).toBe(0);
});

test("generateKeys", async () => {
    let app = createApp();
    await expect(app.generateKeys()).rejects.toThrow();

    app.name = "test";
    await expect(app.generateKeys()).resolves.not.toThrow();
    let fileName = app.getKeys();

    expect(fs.existsSync(fileName.public)).toBe(true);
    expect(fs.existsSync(fileName.private)).toBe(true);

    let publicKey = fs.readFileSync(fileName.public).toString();
    let privateKey = fs.readFileSync(fileName.private).toString();

    expect(publicKey.length).toBeGreaterThan(10);
    expect(privateKey.length).toBeGreaterThan(10);

    await expect(app.generateKeys()).resolves.not.toThrow();

    expect(fs.existsSync(fileName.public)).toBe(true);
    expect(fs.existsSync(fileName.private)).toBe(true);
    expect(publicKey).not.toBe(fs.readFileSync(fileName.public).toString());
    expect(privateKey).not.toBe(fs.readFileSync(fileName.private).toString());

    let secondApp = createApp("masik-app");
    let fileNameSecondApp = secondApp.getKeys();
    await secondApp.generateKeys();

    expect(fs.readdirSync(path.resolve(process.env.CONF_CRYPTO_APPKEYS)).length).toBe(4);
    expect(publicKey).not.toBe(fs.readFileSync(fileNameSecondApp.public).toString());
    expect(privateKey).not.toBe(fs.readFileSync(fileNameSecondApp.private).toString());

    deleteAppKeys(app);
    deleteAppKeys(secondApp);
});

test("hasValidKeys", async () => {
    let app = createApp();

    await expect(app.hasValidKeys()).rejects.toThrow();

    app.name = "test";
    let fileName = app.getKeys();
    expect(await app.hasValidKeys()).toBe(false);

    await app.generateKeys();
    expect(await app.hasValidKeys()).toBe(true);

    fs.unlinkSync(fileName.public);
    expect(await app.hasValidKeys()).toBe(false);

    await app.generateKeys();
    expect(await app.hasValidKeys()).toBe(true);

    fs.unlinkSync(fileName.private);
    expect(await app.hasValidKeys()).toBe(false);

    deleteAppKeys(app);
});

test("signatures", async () => {

    let app = createApp("test");
    await app.generateKeys();

    let data = {
        test: "aaaa",
        foo: 2,
        ip: "127.0.0.1",
    };

    let signature = await app.generateSignature(data);
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(10);

    expect(await app.validateSignature(signature, data)).toBe(true);
    delete data.ip;
    expect(await app.validateSignature(signature, data)).toBe(false);

    deleteAppKeys(app);
});