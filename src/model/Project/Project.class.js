"use strict";
const { Entity } = require("../Entity.class");
const ProjectModel = require("./Project.model");
const { User } = require("../User");
const mongoose = require("mongoose");

/**
 * @typedef {Object} ProjectBean
 * @property {string} name
 * @property {string} [color]
 * @property {(User|mongoose.ObjectId)[]} [participants]
 */

class Project extends Entity
{
    /**
     * @returns {mongoose.ObjectId}
     */
    get id()
    {
        return this.entity._id;
    }

    /**
     * @returns {string}
     */
    get name()
    {
        return this.entity.get("name");
    }

    /**
     * @param {string} value
     */
    set name(value)
    {
        this.entity.set("name", value);
    }

    /**
     * @returns {string}
     */
    get color()
    {
        return this.entity.get("color");
    }

    /**
     * @param {string} value
     */
    set color(value)
    {
        this.entity.set("color", value);
    }

    /**
     * @type {User[]}
     */
    #populatedParticipants = [];

    /**
     * @returns {(User|mongoose.ObjectId)[]}
     */
    get participants()
    {
        try
        {
            this.entity.$assertPopulated("participants");
        }
        catch (e)
        {
            return this.entity.get("participants");
        }

        if (!this.#populatedParticipants.length)
        {
            this.#populatedParticipants = this.entity.get("participants").map(item => new User(item));
        }

        return this.#populatedParticipants;
    }

    /**
     * @returns {Date}
     */
    get created()
    {
        return this.entity.get("created");
    }

    /**
     * @returns {Date}
     */
    get updated()
    {
        return this.entity.get("updated");
    }

    /**
     * @param {ProjectBean|ProjectModel} [initial]
     */
    constructor(initial)
    {
        super(initial instanceof ProjectModel ? initial : new ProjectModel(initial));
    }

    /**
     * @param {(User|mongoose.ObjectId)[]|User|mongoose.ObjectId} users
     * @returns {(User|mongoose.ObjectId)[]}
     */
    addParticipant(users)
    {
        return this.entity.addParticipant(users);
    }

    clearParticipants()
    {
        this.entity.clearParticipants();
    }

    async populateAll()
    {
        await this.populate("participants");
    }
}

module.exports = {
    Project
};