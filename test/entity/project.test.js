"use strict";
const { beforeAll, afterAll, test, expect, afterEach} = require("@jest/globals");
require("../../config/dotenv").environment("test");
const { Project, User} = require("../../model");
const mongoose = require("mongoose");
const users = require("./user.repository");
const projects = require("./project.repository");

let db;

beforeAll(async () => {
    db = await require("../../utils/db");
    await users.createAll();
});

afterAll(async () => {
    await db.dropDatabase();
    await db.close();
});

afterEach(async () => {
    await Project.deleteMany();
});

test("Create", async () => {
    expect.assertions(9);
    let sampleUser = await users.get();
    const project = new Project();

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.name = "Teszt project";

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.color = "#000000";

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.addParticipant(sampleUser);

    await expect(project.save()).resolves.not.toThrow();

    expect(() => project.addParticipant(new Project({ name: "Teszt 2" }))).toThrow();

    expect(() => project.addParticipant(users.mock("Teszt"))).toThrow();

    project.addParticipant(sampleUser);

    expect(project.participants.length).toBe(1);

    const otherProject = new Project({
        name: project.name,
        color: "#ffffff"
    });
    otherProject.addParticipant([sampleUser, await users.get("test")]);
    await expect(otherProject.save()).resolves.not.toThrow();
    expect(await Project.countDocuments()).toBe(2);
});

test("Read", async () => {
    let projectName = "Teszt project";
    const project = await projects.mock(projectName, await users.get(["admin", "test"]));

    await expect(project.save()).resolves.not.toThrow();

    let newProject = await Project.findOne({ name: projectName });

    expect(newProject).not.toBeNull();
    expect(newProject.toObject()).toEqual(project.toObject());
    expect(newProject.participants).toHaveLength(2);
    newProject.participants.forEach(user => {
        expect(user).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(user).not.toBeInstanceOf(User);
    });

    await newProject.populate("participants");

    expect(newProject.toObject()).not.toEqual(project.toObject());
    expect(newProject.participants).toHaveLength(2);
    newProject.participants.forEach(user => {
        expect(user).toBeInstanceOf(User);
    });
});

test("Update", async () => {
    const project = await projects.mock("Teszt project", await users.get(["admin", "test"]));

    await expect(project.save()).resolves.not.toThrow();

    project.name = "Második teszt";
    project.color = "#000000";
    project.clearParticipants();
    project.addParticipant(await users.createRandom());

    await expect(project.save()).resolves.not.toThrow();

    const newProject = await Project.findOne({ name: project.name });

    expect(newProject).not.toBeNull();
    expect(newProject.toObject()).toEqual(project.toObject());

    await expect(newProject.populate("participants")).resolves.not.toThrow();
    await expect(project.populate("participants")).resolves.not.toThrow();

    expect(newProject.toObject()).toEqual(project.toObject());

    project.clearParticipants();
    await expect(project.save()).rejects.toThrow();
});