"use strict";
require("../../config/dotenv").environment("test");
const {beforeAll, afterAll, test, expect, afterEach} = require("@jest/globals");
const { User } = require("../../model/User/User.class");
const { UserRepository } = require("./repository/User.repository");
const Project = require("../../model/Project/Project.model");

const db = require("../db");

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await UserRepository.truncate();
});

/**
 * @param {string} username
 * @param {User} user
 * @param {false|string} password
 */
const checkCreatedUser = function (username, user, password = false)
{
    expect(user).toBeInstanceOf(User);
    expect(typeof user.username).toBe("string");
    expect(user.username).toBe(username);
    expect(user.password).toBeTruthy();
    expect(() => user.checkPassword("test")).not.toThrow();
    expect(user.checkPassword("teszt")).toBe(false);
    if (!password)
    {
        expect(() => user.checkPassword(user.plainPassword)).toThrow();
    }
    else
    {
        expect(user.checkPassword(password)).toBe(true);
    }
};

test("createAll", async () => {

    expect.assertions(2);

    await expect(UserRepository.createAll()).resolves.not.toThrow();

    expect(await UserRepository.countDocuments()).toBe(UserRepository.usernames.length);
});

test("truncate", async () => {
    await expect(UserRepository.createAll()).resolves.not.toThrow();
    await expect(UserRepository.truncate()).resolves.not.toThrow();

    expect(await UserRepository.countDocuments()).toBe(0);
});

test("get", async () => {
    await expect(UserRepository.createAll()).resolves.not.toThrow();

    expect(await UserRepository.get()).toBeInstanceOf(User);
    expect(await UserRepository.get([])).toBeInstanceOf(User);
    expect(await UserRepository.get(null)).toBeInstanceOf(User);
    expect(await UserRepository.get("test")).toBeInstanceOf(User);
    expect(await UserRepository.get("non-existent")).toBeNull();
    expect(await UserRepository.get({ username: "testadmin", aaa: "bbb" })).toBeInstanceOf(User);
    expect(await UserRepository.get(new User({ username: "doest-not-exists" }))).toBeNull();

    await expect(UserRepository.get(12)).rejects.toThrow();
    await expect(UserRepository.get({ no: "nono" })).rejects.toThrow();
    await expect(UserRepository.get(new Project({ name: "testtt" }))).rejects.toThrow();

    expect(await UserRepository.get(["test", "admintest"])).toHaveLength(2);
    expect(await UserRepository.get(["admintest"])).toHaveLength(1);
    expect(await UserRepository.get(UserRepository.usernames)).toHaveLength(UserRepository.usernames.length);
    expect(await UserRepository.get(["aaaaaa", "b"])).toHaveLength(0);
    expect(await UserRepository.get(["test", { username: "admin", noop: "nono" }, "nope"])).toHaveLength(2);
    expect(await UserRepository.get(["test", { username: "admin" }, new User({ username: "admin2" })])).toHaveLength(3);

    await expect(UserRepository.get([14])).rejects.toThrow();
    await expect(UserRepository.get(["admin", null])).rejects.toThrow();
    await expect(UserRepository.get(["admin", { user: "test" }])).rejects.toThrow();
    await expect(UserRepository.get(["admin", { username: "test" }, new User()])).rejects.toThrow();
    await expect(UserRepository.get(["admin", new Project({ name: "test" })])).rejects.toThrow();

    (await UserRepository.get(["testadmin"])).forEach(item => expect(item).toBeInstanceOf(User));
    (await UserRepository.get(["admin", {username: "admin2"}])).forEach(item => expect(item).toBeInstanceOf(User));
    let result = await UserRepository.get(["admin", new User({ username: "test" }), "test3"]);
    expect(result).toHaveLength(2);
    result.forEach(item => expect(item).toBeInstanceOf(User));
});

test("mock", () => {
    let user = UserRepository.mock("nonexistent");
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("nonexistent");
    expect(user.password).toBe(undefined);
    expect(() => user.checkPassword("test")).toThrow();

    user = UserRepository.mock("noper", true);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("noper");
    expect(user.password).toBeTruthy();
    expect(user.checkPassword("false")).toBe(false);
    expect(user.checkPassword(user.plainPassword)).toBe(true);

    let password = "aaaaaaaaaaA2$";
    user = UserRepository.mock("noper", password);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("noper");
    expect(user.password).toBeTruthy();
    expect(user.checkPassword(password)).toBe(true);
});

test("create", async () => {
    let user = await UserRepository.create("nonexistent");
    checkCreatedUser("nonexistent", user);

    let password = "aaaaaaaaaaA2$";
    user = await UserRepository.create("noper", password);
    checkCreatedUser("noper", user, password);

    expect(await UserRepository.countDocuments()).toBe(2);

    await expect(UserRepository.deleteOne({ username: "noper" })).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(1);

    await expect(UserRepository.deleteOne({ username: "noper" })).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(1);

    await expect(UserRepository.deleteOne({ username: "nonexistent" })).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(0);
});

test("mockRandom", () => {
    let count = 1000;
    for (let i = 0; i < count; i++)
    {
        let user = UserRepository.mockRandom();
        expect(user).toBeInstanceOf(User);
        expect(typeof user.username).toBe("string");
        expect(user.username.length).toBeGreaterThan(4);
        expect(user.username.length).toBeLessThan(26);
        expect(user.password).toBe(undefined);
    }

    let user = UserRepository.mockRandom(true);
    expect(user).toBeInstanceOf(User);
    expect(user.password).toBeTruthy();
    expect(user.checkPassword(user.plainPassword)).toBe(true);

    let password = "teszt";
    user = UserRepository.mockRandom(password);
    expect(user).toBeInstanceOf(User);
    expect(user.password).toBeTruthy();
    expect(user.checkPassword("nope")).toBe(false);
    expect(user.checkPassword(user.plainPassword)).toBe(true);
    expect(user.checkPassword(password)).toBe(true);
});

test("createRandom", async () => {
    let user = await UserRepository.createRandom();
    checkCreatedUser(user.username, user);

    let password = "aaaaaaaaaaA2$";
    user = await UserRepository.createRandom(password);
    checkCreatedUser(user.username, user, password);
});