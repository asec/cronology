"use strict";
const env = require("../../config/dotenv").environment("test");
const { beforeAll, afterAll, test, expect, afterEach} = require("@jest/globals");
const { Label } = require("../../src/model/Label");
const { LabelRepository } = require("./repository/Label.repository");
const { User } = require("../../src/model/User");
const { UserRepository } = require("./repository/User.repository");
const mongoose = require("mongoose");

const db = require("../db");

beforeAll(async () => {
    env.enableSilentLogging();
    await db.connect();
    await UserRepository.createAll();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await LabelRepository.truncate();
});

test("Create", async () => {
    expect.assertions(40);
    let sampleUser = await UserRepository.get();

    const label = new Label();
    expect(label.name).toBeUndefined();
    expect(label.color).toBeUndefined();
    expect(label.id).not.toBeUndefined();
    expect(label.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(label.owners).toStrictEqual([]);
    expect(label.created).toBeUndefined();
    expect(label.updated).toBeUndefined();

    await expect(label.save()).rejects.toThrow(mongoose.Error.ValidationError);

    label.name = "Teszt címke";
    expect(label.name).not.toBeUndefined();
    expect(label.color).toBeUndefined();
    expect(label.id).not.toBeUndefined();
    expect(label.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(label.owners).toStrictEqual([]);
    expect(label.created).toBeUndefined();
    expect(label.updated).toBeUndefined();

    await expect(label.save()).rejects.toThrow(mongoose.Error.ValidationError);

    label.color = "#000000";
    expect(label.name).not.toBeUndefined();
    expect(label.color).not.toBeUndefined();
    expect(label.id).not.toBeUndefined();
    expect(label.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(label.owners).toStrictEqual([]);
    expect(label.created).toBeUndefined();
    expect(label.updated).toBeUndefined();

    await expect(label.save()).rejects.toThrow(mongoose.Error.ValidationError);

    label.addOwners(sampleUser);
    expect(label.name).not.toBeUndefined();
    expect(label.color).not.toBeUndefined();
    expect(label.id).not.toBeUndefined();
    expect(label.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(label.owners).toHaveLength(1);
    label.owners.forEach(item => expect(item).toBeInstanceOf(mongoose.Types.ObjectId));
    expect(label.created).toBeUndefined();
    expect(label.updated).toBeUndefined();

    await expect(label.save()).resolves.not.toThrow();
    expect(label.created).toBeInstanceOf(Date);
    expect(label.updated).toBeInstanceOf(Date);

    expect(() => label.addOwners(new Label({ name: "Teszt 2" }))).toThrow();

    expect(() => label.addOwners(UserRepository.mock("Teszt"))).toThrow();

    label.addOwners(sampleUser);

    expect(label.owners.length).toBe(1);

    const otherLabel = new Label({
        name: label.name,
        color: "#ffffff"
    });
    otherLabel.addOwners([
        sampleUser,
        await UserRepository.get("test"),
        (await UserRepository.get("test2")).id
    ]);
    await expect(otherLabel.save()).resolves.not.toThrow();
    expect(await LabelRepository.countDocuments()).toBe(2);
});

test("Read", async () => {
    let labelName = "Teszt címke";

    const label = await LabelRepository.mock(labelName, await UserRepository.get(["admin", "test"]));

    await expect(label.save()).resolves.not.toThrow();

    let newLabel = await LabelRepository.findOne({ name: labelName });

    expect(newLabel).not.toBeNull();
    expect(newLabel.toObject()).toEqual(label.toObject());
    expect(newLabel.owners).toHaveLength(2);
    newLabel.owners.forEach(user => {
        expect(user).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(user).not.toBeInstanceOf(User);
    });

    await newLabel.populateAll();

    expect(newLabel.toObject()).not.toEqual(label.toObject());
    expect(newLabel.owners).toHaveLength(2);
    newLabel.owners.forEach(user => {
        expect(user).toBeInstanceOf(User);
    });
});

test("Update", async () => {
    const label = await LabelRepository.mock(
        "Teszt címke",
        await UserRepository.get(["admin", "test"])
    );

    await expect(label.save()).resolves.not.toThrow();

    label.name = "Második teszt";
    label.color = "#000000";
    label.clearOwners();
    label.addOwners(await UserRepository.createRandom());

    await expect(label.save()).resolves.not.toThrow();

    const newLabel = await LabelRepository.findOne({ name: label.name });

    expect(newLabel).not.toBeNull();
    expect(newLabel.toObject()).toEqual(label.toObject());

    await expect(newLabel.populate("owners")).resolves.not.toThrow();
    await expect(label.populate("owners")).resolves.not.toThrow();

    expect(newLabel.toObject()).toEqual(label.toObject());

    label.clearOwners();
    await expect(label.save()).rejects.toThrow();
});