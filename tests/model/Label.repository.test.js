"use strict";
const env = require("../../config/dotenv").environment("test");
const {beforeAll, afterAll, afterEach, test, expect} = require("@jest/globals");
const { Label } = require("../../src/model/Label");
const { LabelRepository } = require("./repository/Label.repository");
const { User } = require("../../src/model/User");
const { UserRepository } = require("./repository/User.repository");
const mongoose = require("mongoose");

const db = require("../db");

beforeAll(async () => {
    env.enableSilentLogging();
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await LabelRepository.truncate();
    await UserRepository.truncate();
});

const checkOwners = async function (label, expectedLength)
{
    expect(label.owners).toHaveLength(expectedLength);
    label.owners.forEach(userId => {
        expect(userId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    await label.populate("owners");

    expect(label.owners).toHaveLength(expectedLength);
    label.owners.forEach(userId => {
        expect(userId).toBeInstanceOf(User);
    });
};

test("mock", async () => {
    let label = await LabelRepository.mock();

    expect(label).toBeInstanceOf(Label);
    expect(typeof label.name).toBe("string");
    expect(typeof label.color).toBe("string");
    await checkOwners(label, 1);

    let labelName = "Másik teszt";
    let color = "#000000";
    label = await LabelRepository.mock(labelName, null, color);

    expect(label).toBeInstanceOf(Label);
    expect(label.name).toBe(labelName);
    expect(label.color).toBe(color);
    await checkOwners(label, 1);

    label = await LabelRepository.mock("Harmadik", ["elso", "masodik"]);
    expect(label).toBeInstanceOf(Label);
    expect(typeof label.name).toBe("string");
    expect(typeof label.color).toBe("string");
    await checkOwners(label, 2);

    let ownersCount = 5;
    label = await LabelRepository.mock("Teszt project", ownersCount);
    expect(label).toBeInstanceOf(Label);
    expect(typeof label.name).toBe("string");
    expect(typeof label.color).toBe("string");
    await checkOwners(label, ownersCount);

    await expect(
        LabelRepository.mock(
            "Teszt címke",
            UserRepository.mock("valaki")
        )
    ).rejects.toThrow();

    await expect(
        LabelRepository.mock(
            "Teszt címke",
            [
                UserRepository.mock("másvalaki")
            ]
        )
    ).rejects.toThrow();

    await expect(
        LabelRepository.mock("Tesztteszt", [10, 20])
    ).rejects.toThrow();

    await expect(
        LabelRepository.mock("Tesztteszt", new Date())
    ).rejects.toThrow();

    label = await LabelRepository.mock("Teszt címke", await UserRepository.create("valaki"));
    expect(label).toBeInstanceOf(Label);
    expect(typeof label.name).toBe("string");
    expect(typeof label.color).toBe("string");
    await checkOwners(label, 1);

    label = await LabelRepository.mock(
        "Teszt címke",
        [
            await UserRepository.create("másvalaki"),
            await UserRepository.create("mégvalaki"),
        ]
    );
    expect(label).toBeInstanceOf(Label);
    expect(typeof label.name).toBe("string");
    expect(typeof label.color).toBe("string");
    await checkOwners(label, 2);
}, 20000);

test("findOne / deleteOne", async () => {
    let label = await LabelRepository.mock("Teszt", 1, "#000000");
    await label.save();

    let otherLabel = await LabelRepository.mock("aa", 10, "#fff000");
    await otherLabel.save();

    expect(await LabelRepository.countDocuments()).toBe(2);
    expect(await LabelRepository.findOne({ name: "aaaa" })).toBeNull();
    expect(await LabelRepository.findOne({ name: "Teszt" })).toBeInstanceOf(Label);
    expect(await LabelRepository.findOne({ name: "aa" })).toBeInstanceOf(Label);

    await LabelRepository.deleteOne({ name: "aa" });

    expect(await LabelRepository.countDocuments()).toBe(1);
    expect(await LabelRepository.findOne({ name: "Teszt" })).toBeInstanceOf(Label);
    expect(await LabelRepository.findOne({ name: "aa" })).toBeNull();

    await LabelRepository.deleteOne({ name: "Teszt" });
    expect(await LabelRepository.countDocuments()).toBe(0);
});

test("insertMany", async () => {
    let count = 10;
    /**
     * @type {(Label|LabelBean)[]}
     */
    let labels = [];
    for (let i = 0; i < count; i++)
    {
        labels.push(await LabelRepository.mock("Címke", 1, "#0f0f0f"));
    }
    labels.push({
        name: "LabelBean",
        color: "#aaaaaa",
        owners: [(await UserRepository.createRandom()).id]
    })
    await LabelRepository.insertMany(labels);

    expect(await LabelRepository.countDocuments()).toBe(count + 1);

    let findOne = await LabelRepository.findOne({ name: "Címke" });
    expect(findOne).toBeInstanceOf(Label);
});