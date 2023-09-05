"use strict";
require("../../config/dotenv").environment("test");
const {beforeAll, afterAll, afterEach, test, expect} = require("@jest/globals");
const { Project } = require("../../model/Project");
const { ProjectRepository } = require("./repository/Project.repository");
const { User } = require("../../model/User");
const { UserRepository } = require("./repository/User.repository");
const mongoose = require("mongoose");

const db = require("../db");

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await ProjectRepository.truncate();
    await UserRepository.truncate();
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
    let project = await ProjectRepository.mock();

    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 1);

    let projectName = "Másik teszt";
    let color = "#000000";
    project = await ProjectRepository.mock(projectName, null, color);

    expect(project).toBeInstanceOf(Project);
    expect(project.name).toBe(projectName);
    expect(project.color).toBe(color);
    await checkParticipants(project, 1);

    project = await ProjectRepository.mock("Harmadik", ["elso", "masodik"]);
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 2);

    let participantCount = 5;
    project = await ProjectRepository.mock("Teszt project", participantCount);
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, participantCount);

    await expect(
        ProjectRepository.mock(
            "Teszt project",
            UserRepository.mock("valaki")
        )
    ).rejects.toThrow();

    await expect(
        ProjectRepository.mock(
            "Teszt project",
            [
                UserRepository.mock("másvalaki")
            ]
        )
    ).rejects.toThrow();

    await expect(
        ProjectRepository.mock("Tesztteszt", [10, 20])
    ).rejects.toThrow();

    await expect(
        ProjectRepository.mock("Tesztteszt", new Date())
    ).rejects.toThrow();

    project = await ProjectRepository.mock("Teszt project", await UserRepository.create("valaki"));
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 1);

    project = await ProjectRepository.mock(
        "Teszt project",
        [
            await UserRepository.create("másvalaki"),
            await UserRepository.create("mégvalaki"),
        ]
    );
    expect(project).toBeInstanceOf(Project);
    expect(typeof project.name).toBe("string");
    expect(typeof project.color).toBe("string");
    await checkParticipants(project, 2);
}, 20000);

test("findOne / deleteOne", async () => {
    let project = await ProjectRepository.mock("Teszt", 1, "#000000");
    await project.save();

    let otherProject = await ProjectRepository.mock("aa", 10, "#fff000");
    await otherProject.save();

    expect(await ProjectRepository.countDocuments()).toBe(2);
    expect(await ProjectRepository.findOne({ name: "aaaa" })).toBeNull();
    expect(await ProjectRepository.findOne({ name: "Teszt" })).toBeInstanceOf(Project);
    expect(await ProjectRepository.findOne({ name: "aa" })).toBeInstanceOf(Project);

    await ProjectRepository.deleteOne({ name: "aa" });

    expect(await ProjectRepository.countDocuments()).toBe(1);
    expect(await ProjectRepository.findOne({ name: "Teszt" })).toBeInstanceOf(Project);
    expect(await ProjectRepository.findOne({ name: "aa" })).toBeNull();

    await ProjectRepository.deleteOne({ name: "Teszt" });
    expect(await ProjectRepository.countDocuments()).toBe(0);
});

test("insertMany", async () => {
    let count = 10;
    /**
     * @type {(Project|ProjectBean)[]}
     */
    let projects = [];
    for (let i = 0; i < count; i++)
    {
        projects.push(await ProjectRepository.mock("Project", 1, "#0f0f0f"));
    }
    projects.push({
        name: "ProjectBean",
        color: "#aaaaaa",
        participants: [(await UserRepository.createRandom()).id]
    })
    await ProjectRepository.insertMany(projects);

    expect(await ProjectRepository.countDocuments()).toBe(count + 1);

    let findOne = await ProjectRepository.findOne({ name: "Project" });
    expect(findOne).toBeInstanceOf(Project);
});