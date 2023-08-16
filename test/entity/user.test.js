"use strict";
require("../../config/dotenv").environment("test");
const { beforeAll, afterAll, test, afterEach, expect} = require("@jest/globals");
const {User} = require("../../model");
const mongoose = require("mongoose");
const db = require("../db");

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await User.deleteMany();
});

test("Random password generator", async () => {
    let user = new User({
        username: "admin",
        password: ""
    });
    let testSize = 10000;
    expect.assertions(3 * testSize);
    for (let i = 0; i < testSize; i++)
    {
        let newPassword = User.generateRandomPassword();
        user.plainPassword = newPassword;

        expect(user.password).not.toBe(newPassword);
        expect(user.plainPassword).toBe(newPassword);

        await expect(user.validate()).resolves.not.toThrow();
    }
});

test("Passwords", async () => {
    expect.assertions(26);

    let rawUserData = {
        username: "admin",
        password: "admin"
    };
    let otherPasswords = [
        "tesztaaaaaaa",
        "tesztaaaaaaaA",
        "tesztaaaaaaaA1",
        "tesztaaaaaaaA1$",
        User.generateRandomPassword()
    ];
    let user = new User(rawUserData);

    expect(user.username).toBe(rawUserData.username);
    expect(user.password).not.toBe(rawUserData.password);
    expect(user.plainPassword).toBe(rawUserData.password);
    expect(user.checkPassword(rawUserData.password)).toBe(true);

    await expect(user.validate()).rejects.toThrow(mongoose.Error.ValidationError);

    for (let i = 0; i < otherPasswords.length; i++)
    {
        let newPassword = otherPasswords[i];
        user.password = newPassword;
        expect(user.password).not.toBe(newPassword);
        expect(user.plainPassword).toBe(newPassword);
        expect(user.checkPassword(newPassword)).toBe(true);

        if (i <= 2)
        {
            await expect(user.validate()).rejects.toThrow(mongoose.Error.ValidationError);
        }
        else
        {
            await expect(user.validate()).resolves.not.toThrow();
        }
    }

    user = new User({ username: "no-password" });
    expect(() => user.checkPassword("teszt")).toThrow();
});

test("Create (OK)", async () => {
    expect.assertions(13);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let badpassword = User.generateRandomPassword();
    let user = new User(rawUserData);

    expect(user.username).toBe(rawUserData.username);
    expect(user.password).not.toBe(rawUserData.password);
    expect(user.checkPassword(rawUserData.password)).toBe(true);

    await expect(user.save()).resolves.not.toThrow();

    expect(await User.countDocuments()).toBe(1);

    let secondUser = new User({ ...rawUserData, password: badpassword });
    expect(secondUser.checkPassword(rawUserData.password)).not.toBe(true);
    expect(secondUser.checkPassword(badpassword)).toBe(true);

    await expect(user.save()).resolves.not.toThrow();
    await expect(secondUser.save()).rejects.toThrow();

    secondUser.username = rawUserData.username + "2";

    expect(secondUser.username).not.toBe(rawUserData.username);
    expect(secondUser.checkPassword(badpassword)).toBe(true);

    await expect(secondUser.save()).resolves.not.toThrow();
    expect(await User.countDocuments()).toBe(2);
});

test("Read", async () => {
    expect.assertions(6);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let user = new User(rawUserData);

    await expect(user.save()).resolves.not.toThrow();
    expect(await User.countDocuments()).toBe(1);

    let sameUser = await User.findOne({ username: rawUserData.username });
    expect(sameUser).not.toBeNull()
    expect(sameUser.toObject()).toEqual(user.toObject());
    expect(sameUser.checkPassword(rawUserData.password)).toBe(true);

    sameUser = await User.findOne({ username: "2" });
    expect(sameUser).toBeNull();
});

test("Update", async () => {
    expect.assertions(8);

    let rawUserData = [
        {
            username: "admin",
            password: User.generateRandomPassword()
        },
        {
            username: "teszt",
            password: User.generateRandomPassword()
        }
    ];
    let user = new User(rawUserData[0]);
    await expect(user.save()).resolves.not.toThrow();

    let secondUser = new User(rawUserData[1]);
    await expect(secondUser.save()).resolves.not.toThrow();

    user.username = rawUserData[1].username;
    let newPassword = User.generateRandomPassword();
    user.password = newPassword;

    await expect(user.save()).rejects.toThrow();

    user.username = rawUserData[1].username + "2";
    await expect(user.save()).resolves.not.toThrow();

    let sameUser = await User.findOne({ username: rawUserData[0].username });
    expect(sameUser).toBeNull();

    sameUser = await User.findOne({ username: rawUserData[1].username + "2" });
    expect(sameUser).not.toBeNull();

    expect(sameUser.checkPassword(newPassword)).toBe(true);

    expect(await User.countDocuments()).toBe(2);
});

test("Delete", async () => {
    expect.assertions(3);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let user = new User(rawUserData);

    await expect(user.save()).resolves.not.toThrow();
    expect(await User.countDocuments()).toBe(1);

    await User.deleteOne({ username: "admin" });

    expect(await User.countDocuments()).toBe(0);
});