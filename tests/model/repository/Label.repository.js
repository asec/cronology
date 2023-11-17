"use strict";
const { User } = require("../../../src/model/User");
const { UserRepository } = require("./User.repository");
const { Label, LabelRepository } = require("../../../src/model/Label");

class LabelRepositoryForTests extends LabelRepository
{

    /**
     * @param {string} name
     * @param {(string|User)[]|User|number|null} [owners = null] - Can be an array of usernames, an array of User
     * entities, a User model, a number describing how many random User models you'd like to add or null. If the
     * value is null, the code will add one random user model as a participant.
     * @param {string|null} [color = null]
     * @returns {Promise<Label>}
     */
    static async mock(name = "Teszt címke", owners = null, color = null)
    {
        if (!color || typeof color !== "string")
        {
            color = "#";
            for (let i = 0; i < 6; i++)
            {
                color += String(Math.floor(Math.random() * 10 % 10));
            }
        }
        let label = new Label({
            name,
            color
        });
        if (!owners)
        {
            label.addOwners(await UserRepository.createRandom());
        }
        else if (Array.isArray(owners))
        {
            for (let i = 0; i < owners.length; i++)
            {
                let user = owners[i];
                if (typeof user === "string")
                {
                    label.addOwners(await UserRepository.create(user));
                    continue;
                }
                else if (user instanceof User)
                {
                    label.addOwners(user);
                    continue;
                }

                console.warn("Invalid owner type", user);
                throw new Error("Invalid owner type: " + user);
            }
        }
        else if (owners instanceof User)
        {
            label.addOwners(owners);
        }
        else if (typeof owners === "number")
        {
            for (let i = 0; i < owners; i++)
            {
                label.addOwners(await UserRepository.createRandom());
            }
        }
        else
        {
            console.warn("Invalid owner type", owners);
            throw new Error("Invalid owner type: " + owners);
        }

        return label;
    }

}

module.exports = {
    LabelRepository: LabelRepositoryForTests
};