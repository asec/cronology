"use strict";
const { User } = require("../../../src/model/User");
const { UserRepository } = require("./User.repository");
const { Project, ProjectRepository } = require("../../../src/model/Project");

class ProjectRepositoryForTests extends ProjectRepository
{

    /**
     * @param {string} name
     * @param {(string|User)[]|User|number|null} [participants = null] - Can be an array of usernames, an array of User
     * entities, a User entity, a number describing how many random User entities you'd like to add or null. If the
     * value is null, the code will add one random user entity as a participant.
     * @param {string|null} [color = null]
     * @returns {Promise<Project>}
     */
    static async mock(name = "Teszt project", participants = null, color = null)
    {
        if (!color || typeof color !== "string")
        {
            color = "#";
            for (let i = 0; i < 6; i++)
            {
                color += String(Math.floor(Math.random() * 10 % 10));
            }
        }
        let project = new Project({
            name,
            color
        });
        if (!participants)
        {
            project.addParticipant(await UserRepository.createRandom());
        }
        else if (Array.isArray(participants))
        {
            for (let i = 0; i < participants.length; i++)
            {
                let user = participants[i];
                if (typeof user === "string")
                {
                    project.addParticipant(await UserRepository.create(user));
                    continue;
                }
                else if (user instanceof User)
                {
                    project.addParticipant(user);
                    continue;
                }

                console.warn("Invalid participant", user);
                throw new Error("Invalid participant: " + user);
            }
        }
        else if (participants instanceof User)
        {
            project.addParticipant(participants);
        }
        else if (typeof participants === "number")
        {
            for (let i = 0; i < participants; i++)
            {
                project.addParticipant(await UserRepository.createRandom());
            }
        }
        else
        {
            console.warn("Invalid participant", participants);
            throw new Error("Invalid participant: " + participants);
        }

        return project;
    }

}

module.exports = {
    ProjectRepository: ProjectRepositoryForTests
};