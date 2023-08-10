"use strict";
const users = require("./user.repository");
const {Project, User} = require("../../model");

class ProjectRepository
{

    async mock(name = "Teszt project", participants = null, color = null)
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
            project.addParticipant(await users.createRandom());
        }
        else if (Array.isArray(participants))
        {
            for (let i = 0; i < participants.length; i++)
            {
                let user = participants[i];
                if (typeof user === "string")
                {
                    project.addParticipant(await users.create(user));
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
                project.addParticipant(await users.createRandom());
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

module.exports = new ProjectRepository();