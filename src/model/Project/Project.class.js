"use strict";
const { Model } = require("../Model.class");
const ProjectModel = require("./Project.model");
const { User } = require("../User");
const mongoose = require("mongoose");

/**
 * @typedef {Object} ProjectBean
 * @property {string} name
 * @property {string} [color]
 * @property {(User|mongoose.ObjectId)[]} [participants]
 */

class Project extends Model
{
    /**
     * @returns {mongoose.ObjectId}
     */
    get id()
    {
        return this.model._id;
    }

    /**
     * @returns {string}
     */
    get name()
    {
        return this.model.get("name");
    }

    /**
     * @param {string} value
     */
    set name(value)
    {
        this.model.set("name", value);
    }

    /**
     * @returns {string}
     */
    get color()
    {
        return this.model.get("color");
    }

    /**
     * @param {string} value
     */
    set color(value)
    {
        this.model.set("color", value);
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
            this.model.$assertPopulated("participants");
        }
        catch (e)
        {
            return this.model.get("participants");
        }

        if (!this.#populatedParticipants.length)
        {
            this.#populatedParticipants = this.model.get("participants").map(item => new User(item));
        }

        return this.#populatedParticipants;
    }

    /**
     * @returns {Date}
     */
    get created()
    {
        return this.model.get("created");
    }

    /**
     * @returns {Date}
     */
    get updated()
    {
        return this.model.get("updated");
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
        return this.model.addParticipant(users);
    }

    clearParticipants()
    {
        this.model.clearParticipants();
    }

    async populateAll()
    {
        await this.populate("participants");
    }
}

module.exports = {
    Project
};