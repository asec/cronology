"use strict";
const { beforeAll, afterAll, test, expect, afterEach} = require("@jest/globals");
require("../../config/dotenv").environment("test");
const { Project } = require("../../model/Project");
const { ProjectRepository } = require("./repository/Project.repository");
const { User } = require("../../model/User");
const { UserRepository } = require("./repository/User.repository");
const mongoose = require("mongoose");

const db = require("../db");

beforeAll(async () => {
    await db.connect();
    await UserRepository.createAll();
});

afterAll(async () => {
    await db.tearDown();
});

afterEach(async () => {
    await ProjectRepository.truncate();
});

test("Create", async () => {
    expect.assertions(40);
    let sampleUser = await UserRepository.get();

    const project = new Project();
    expect(project.name).toBeUndefined();
    expect(project.color).toBeUndefined();
    expect(project.id).not.toBeUndefined();
    expect(project.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(project.participants).toStrictEqual([]);
    expect(project.created).toBeUndefined();
    expect(project.updated).toBeUndefined();

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.name = "Teszt project";
    expect(project.name).not.toBeUndefined();
    expect(project.color).toBeUndefined();
    expect(project.id).not.toBeUndefined();
    expect(project.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(project.participants).toStrictEqual([]);
    expect(project.created).toBeUndefined();
    expect(project.updated).toBeUndefined();

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.color = "#000000";
    expect(project.name).not.toBeUndefined();
    expect(project.color).not.toBeUndefined();
    expect(project.id).not.toBeUndefined();
    expect(project.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(project.participants).toStrictEqual([]);
    expect(project.created).toBeUndefined();
    expect(project.updated).toBeUndefined();

    await expect(project.save()).rejects.toThrow(mongoose.Error.ValidationError);

    project.addParticipant(sampleUser);
    expect(project.name).not.toBeUndefined();
    expect(project.color).not.toBeUndefined();
    expect(project.id).not.toBeUndefined();
    expect(project.id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(project.participants).toHaveLength(1);
    project.participants.forEach(item => expect(item).toBeInstanceOf(mongoose.Types.ObjectId));
    expect(project.created).toBeUndefined();
    expect(project.updated).toBeUndefined();

    await expect(project.save()).resolves.not.toThrow();
    expect(project.created).toBeInstanceOf(Date);
    expect(project.updated).toBeInstanceOf(Date);

    expect(() => project.addParticipant(new Project({ name: "Teszt 2" }))).toThrow();

    expect(() => project.addParticipant(UserRepository.mock("Teszt"))).toThrow();

    project.addParticipant(sampleUser);

    expect(project.participants.length).toBe(1);

    const otherProject = new Project({
        name: project.name,
        color: "#ffffff"
    });
    otherProject.addParticipant([
        sampleUser,
        await UserRepository.get("test"),
        (await UserRepository.get("test2")).id
    ]);
    await expect(otherProject.save()).resolves.not.toThrow();
    expect(await ProjectRepository.countDocuments()).toBe(2);
});

test("Read", async () => {
    let projectName = "Teszt project";

    const project = await ProjectRepository.mock(projectName, await UserRepository.get(["admin", "test"]));

    await expect(project.save()).resolves.not.toThrow();

    let newProject = await ProjectRepository.findOne({ name: projectName });

    expect(newProject).not.toBeNull();
    expect(newProject.toObject()).toEqual(project.toObject());
    expect(newProject.participants).toHaveLength(2);
    newProject.participants.forEach(user => {
        expect(user).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(user).not.toBeInstanceOf(User);
    });

    await newProject.populateAll();

    expect(newProject.toObject()).not.toEqual(project.toObject());
    expect(newProject.participants).toHaveLength(2);
    newProject.participants.forEach(user => {
        expect(user).toBeInstanceOf(User);
    });
});

test("Update", async () => {
    const project = await ProjectRepository.mock(
        "Teszt project",
        await UserRepository.get(["admin", "test"])
    );

    await expect(project.save()).resolves.not.toThrow();

    project.name = "Második teszt";
    project.color = "#000000";
    project.clearParticipants();
    project.addParticipant(await UserRepository.createRandom());

    await expect(project.save()).resolves.not.toThrow();

    const newProject = await ProjectRepository.findOne({ name: project.name });

    expect(newProject).not.toBeNull();
    expect(newProject.toObject()).toEqual(project.toObject());

    await expect(newProject.populate("participants")).resolves.not.toThrow();
    await expect(project.populate("participants")).resolves.not.toThrow();

    expect(newProject.toObject()).toEqual(project.toObject());

    project.clearParticipants();
    await expect(project.save()).rejects.toThrow();
});