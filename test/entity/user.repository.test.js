"use strict";
require("../../config/dotenv").environment("test");
const repository = require("./user.repository");
const {beforeAll, afterAll, test, expect, afterEach} = require("@jest/globals");
const {User, Project} = require("../../model");

let db;

beforeAll(async () => {
    db = await require("../../utils/db");
});

afterAll(async () => {
    await db.dropDatabase();
    await db.close();
});

afterEach(async () => {
    await User.deleteMany();
});

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

    await expect(repository.createAll()).resolves.not.toThrow();

    expect(await User.countDocuments()).toBe(repository.usernames.length);
});

test("truncate", async () => {
    await expect(repository.createAll()).resolves.not.toThrow();
    await expect(repository.truncate()).resolves.not.toThrow();

    expect(await User.countDocuments()).toBe(0);
});

test("get", async () => {
    await expect(repository.createAll()).resolves.not.toThrow();

    expect(await repository.get()).toBeInstanceOf(User);
    expect(await repository.get([])).toBeInstanceOf(User);
    expect(await repository.get(null)).toBeInstanceOf(User);
    expect(await repository.get("test")).toBeInstanceOf(User);
    expect(await repository.get("non-existent")).toBeNull();
    expect(await repository.get({ username: "testadmin", aaa: "bbb" })).toBeInstanceOf(User);
    expect(await repository.get(new User({ username: "doest-not-exists" }))).toBeNull();

    await expect(repository.get(12)).rejects.toThrow();
    await expect(repository.get({ no: "nono" })).rejects.toThrow();
    await expect(repository.get(new Project({ name: "testtt" }))).rejects.toThrow();

    expect(await repository.get(["test", "admintest"])).toHaveLength(2);
    expect(await repository.get(["admintest"])).toHaveLength(1);
    expect(await repository.get(repository.usernames)).toHaveLength(repository.usernames.length);
    expect(await repository.get(["aaaaaa", "b"])).toHaveLength(0);
    expect(await repository.get(["test", { username: "admin", noop: "nono" }, "nope"])).toHaveLength(2);
    expect(await repository.get(["test", { username: "admin" }, new User({ username: "admin2" })])).toHaveLength(3);

    await expect(repository.get([14])).rejects.toThrow();
    await expect(repository.get(["admin", null])).rejects.toThrow();
    await expect(repository.get(["admin", { user: "test" }])).rejects.toThrow();
    await expect(repository.get(["admin", { username: "test" }, new User()])).rejects.toThrow();
    await expect(repository.get(["admin", new Project({ name: "test" })])).rejects.toThrow();
});

test("mock", () => {
    let user = repository.mock("nonexistent");
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("nonexistent");
    expect(user.password).toBe(undefined);
    expect(() => user.checkPassword("test")).toThrow();

    user = repository.mock("noper", true);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("noper");
    expect(user.password).toBeTruthy();
    expect(user.checkPassword("false")).toBe(false);
    expect(user.checkPassword(user.plainPassword)).toBe(true);

    let password = "aaaaaaaaaaA2$";
    user = repository.mock("noper", password);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe("noper");
    expect(user.password).toBeTruthy();
    expect(user.checkPassword(password)).toBe(true);
});

test("create", async () => {
    let user = await repository.create("nonexistent");
    checkCreatedUser("nonexistent", user);

    let password = "aaaaaaaaaaA2$";
    user = await repository.create("noper", password);
    checkCreatedUser("noper", user, password);
});

test("mockRandom", () => {
    let count = 1000;
    for (let i = 0; i < count; i++)
    {
        let user = repository.mockRandom();
        expect(user).toBeInstanceOf(User);
        expect(typeof user.username).toBe("string");
        expect(user.username.length).toBeGreaterThan(4);
        expect(user.username.length).toBeLessThan(26);
        expect(user.password).toBe(undefined);
    }

    let user = repository.mockRandom(true);
    expect(user).toBeInstanceOf(User);
    expect(user.password).toBeTruthy();
    expect(user.checkPassword(user.plainPassword)).toBe(true);

    let password = "teszt";
    user = repository.mockRandom(password);
    expect(user).toBeInstanceOf(User);
    expect(user.password).toBeTruthy();
    expect(user.checkPassword("nope")).toBe(false);
    expect(user.checkPassword(user.plainPassword)).toBe(true);
    expect(user.checkPassword(password)).toBe(true);
});

test("createRandom", async () => {
    let user = await repository.createRandom();
    checkCreatedUser(user.username, user);

    let password = "aaaaaaaaaaA2$";
    user = await repository.createRandom(password);
    checkCreatedUser(user.username, user, password);
});