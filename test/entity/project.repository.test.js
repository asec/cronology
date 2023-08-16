"use strict";
const repository = require("./project.repository");
const users = require("./user.repository");
const {beforeAll, afterAll, afterEach, test, expect} = require("@jest/globals");
const {Project, User} = require("../../model");
const mongoose = require("mongoose");
require("../../config/dotenv").environment("test");

const db = require("../db");

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await Project.deleteMany();
    await User.deleteMany();
});

const checkParticipants = async function (project, expectedLength)
{
    expect(project.participants).toHaveLength(expectedLength);
    project.participants.forEach(userId => {
        expect(userId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    await project.populate("participants");

    expect(project.participants).toHaveLength(expectedLength);
    project.participants.forEach(userId => {
        expect(userId).toBeInstanceOf(User);
    });
};

test("mock", async () => {
    let project = await repository.mock();

    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 1);

    let projectName = "Másik teszt";
    let color = "#000000";
    project = await repository.mock(projectName, null, color);

    expect(project).toBeInstanceOf(Project);
    expect(project.name).toBe(projectName);
    expect(project.color).toBe(color);
    await checkParticipants(project, 1);

    project = await repository.mock("Harmadik", ["elso", "masodik"]);
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 2);

    let participantCount = 5;
    project = await repository.mock("Teszt project", participantCount);
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, participantCount);

    await expect(
        repository.mock(
            "Teszt project",
            users.mock("valaki")
        )
    ).rejects.toThrow();

    await expect(
        repository.mock(
            "Teszt project",
            [
                users.mock("másvalaki")
            ]
        )
    ).rejects.toThrow();

    project = await repository.mock("Teszt project", await users.create("valaki"));
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 1);

    project = await repository.mock(
        "Teszt project",
        [
            await users.create("másvalaki"),
            await users.create("mégvalaki"),
        ]
    );
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 2);
}, 20000);