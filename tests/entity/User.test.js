"use strict";
require("../../config/dotenv").environment("test");
const { beforeAll, afterAll, test, afterEach, expect} = require("@jest/globals");

const { User, UserRepository } = require("../../src/model/User");
const mongoose = require("mongoose");
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

test("Random password generator", async () => {
    let user = new User({
        username: "admin",
        password: ""
    });

    let testSize = 10000;
    expect.assertions(3 * testSize + 2);
    for (let i = 0; i < testSize; i++)
    {
        let newPassword = User.generateRandomPassword();
        user.plainPassword = newPassword;

        expect(user.password).not.toBe(newPassword);
        expect(user.plainPassword).toBe(newPassword);

        await expect(user.validate()).resolves.not.toThrow();
    }

    let newPassword = User.generateRandomPassword(0);
    expect(newPassword.length).toBeGreaterThanOrEqual(20);
    expect(newPassword.length).toBeLessThanOrEqual(40);
});

test("Passwords", async () => {
    expect.assertions(29);

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

    user = new User({
        username: "teszt4",
        password: User.generateRandomPassword()
    });
    await expect(user.validate()).resolves.not.toThrow();
    await expect(user.validate()).resolves.not.toThrow();

    user.plainPassword = 10;
    await expect(user.validate()).rejects.toThrow(mongoose.Error.ValidationError);
});

test("Create (OK)", async () => {
    expect.assertions(33);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let badpassword = User.generateRandomPassword();
    let user = new User(rawUserData);

    expect(user.username).toBe(rawUserData.username);
    expect(user.password).not.toBe(rawUserData.password);
    expect(user.checkPassword(rawUserData.password)).toBe(true);
    expect(user.isAdmin).toBeUndefined();
    expect(user.accessToken).toBeUndefined();
    expect(user.accessTokenValid).toBeUndefined();
    expect(user.loginDate).toBeUndefined();
    expect(user.id).not.toBeUndefined();
    expect(user.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(user.created).toBeUndefined();
    expect(user.updated).toBeUndefined();

    await expect(user.save()).resolves.not.toThrow();

    expect(await UserRepository.countDocuments()).toBe(1);

    let now = new Date();
    let dateDiffThreshold = 100;
    let secondUser = new User({
        ...rawUserData,
        password: badpassword,
        isAdmin: false,
        accessToken: "a",
        accessTokenValid: null,
        loginDate: null
    });
    secondUser.isAdmin = true;
    secondUser.accessToken = "test";
    secondUser.accessTokenValid = now;
    secondUser.loginDate = now;
    expect(secondUser.checkPassword(rawUserData.password)).not.toBe(true);
    expect(secondUser.checkPassword(badpassword)).toBe(true);
    expect(secondUser.isAdmin).toBe(true);
    expect(secondUser.accessToken).toBe("test");
    expect(secondUser.accessTokenValid).toStrictEqual(now);
    expect(secondUser.loginDate).toStrictEqual(now);

    await expect(user.save()).resolves.not.toThrow();
    await expect(secondUser.save()).rejects.toThrow();

    expect(secondUser.isAdmin).toBe(true);
    expect(secondUser.accessToken).toBe("test");
    expect(secondUser.accessTokenValid).toStrictEqual(now);
    expect(secondUser.loginDate).toStrictEqual(now);
    expect(secondUser.created).toBeInstanceOf(Date);
    expect(secondUser.updated).toBeInstanceOf(Date);
    expect(secondUser.created - now).toBeLessThanOrEqual(dateDiffThreshold);
    expect(secondUser.updated - now).toBeLessThanOrEqual(dateDiffThreshold);

    secondUser.username = rawUserData.username + "2";

    expect(secondUser.username).not.toBe(rawUserData.username);
    expect(secondUser.checkPassword(badpassword)).toBe(true);

    await expect(secondUser.save()).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(2);
});

test("Read", async () => {
    expect.assertions(8);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let user = new User(rawUserData);

    await expect(user.save()).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(1);

    let sameUser = await UserRepository.findOne({ username: rawUserData.username });
    expect(sameUser).not.toBeNull()
    expect(sameUser).not.toBe(user);
    expect(sameUser.toObject()).toStrictEqual(user.toObject());
    expect(sameUser.checkPassword(rawUserData.password)).toBe(true);

    let thirdUser = await UserRepository.findOne({ username: rawUserData.username });
    expect(thirdUser.toString()).toBe(sameUser.toString());

    sameUser = await UserRepository.findOne({ username: "2" });
    expect(sameUser).toBeNull();
});

test("Update", async () => {
    expect.assertions(13);

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
    expect(user.plainPassword).not.toBeUndefined();
    await expect(user.save()).resolves.not.toThrow();
    expect(user.plainPassword).toBeUndefined();

    let secondUser = new User(rawUserData[1]);
    await expect(secondUser.save()).resolves.not.toThrow();

    user.username = rawUserData[1].username;
    let newPassword = User.generateRandomPassword();
    user.password = newPassword;

    expect(user.plainPassword).not.toBeUndefined();
    await expect(user.save()).rejects.toThrow();
    expect(user.plainPassword).not.toBeUndefined();

    user.username = rawUserData[1].username + "2";
    await expect(user.save()).resolves.not.toThrow();
    expect(user.plainPassword).toBeUndefined();

    let sameUser = await UserRepository.findOne({ username: rawUserData[0].username });
    expect(sameUser).toBeNull();

    sameUser = await UserRepository.findOne({ username: rawUserData[1].username + "2" });
    expect(sameUser).not.toBeNull();

    expect(sameUser.checkPassword(newPassword)).toBe(true);

    expect(await UserRepository.countDocuments()).toBe(2);
});

test("Delete", async () => {
    expect.assertions(3);

    let rawUserData = {
        username: "admin",
        password: User.generateRandomPassword()
    };
    let user = new User(rawUserData);

    await expect(user.save()).resolves.not.toThrow();
    expect(await UserRepository.countDocuments()).toBe(1);

    await UserRepository.deleteOne({ username: "admin" });

    expect(await UserRepository.countDocuments()).toBe(0);
});