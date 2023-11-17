"use strict";
const { Model } = require("../Model.class");
const LabelModel = require("./Label.model");
const { User } = require("../User");
const mongoose = require("mongoose");

/**
 * @typedef {Object} LabelBean
 * @property {string} name
 * @property {string} [color]
 * @property {(User|mongoose.ObjectId)[]} [owners]
 */

class Label extends Model
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
    #populatedOwners = [];

    /**
     * @returns {(User|mongoose.ObjectId)[]}
     */
    get owners()
    {
        try
        {
            this.model.$assertPopulated("owners");
        }
        catch (e)
        {
            return this.model.get("owners");
        }

        if (!this.#populatedOwners.length)
        {
            this.#populatedOwners = this.model.get("owners").map(item => new User(item));
        }

        return this.#populatedOwners;
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
     * @param {LabelBean|LabelModel} [initial]
     */
    constructor(initial)
    {
        super(initial instanceof LabelModel ? initial : new LabelModel(initial));
    }

    /**
     * @param {(User|mongoose.ObjectId)[]|User|mongoose.ObjectId} users
     * @returns {(User|mongoose.ObjectId)[]}
     */
    addOwners(users)
    {
        return this.model.addOwners(users);
    }

    clearOwners()
    {
        this.model.clearOwners();
    }

    async populateAll()
    {
        await this.populate("owners");
    }
}

module.exports = {
    Label
};