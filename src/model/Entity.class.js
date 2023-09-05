"use strict";
const mongoose = require("mongoose");

class Entity
{
    /**
     * @type {mongoose.Document}
     */
    #entity = null;

    /**
     * @returns {number}
     */
    get __v()
    {
        return this.#entity.__v;
    }

    /**
     * @returns {mongoose.Document}
     * @protected
     */
    get entity()
    {
        return this.#entity;
    }

    /**
     * @param {mongoose.Document} entity
     */
    constructor(entity)
    {
        this.#setEntity(entity);
    }

    /**
     * @param {mongoose.Document} entity
     */
    #setEntity(entity)
    {
        this.#entity = entity;
    }

    /**
     * @param {mongoose.PathsToValidate|undefined} [pathsToValidate]
     * @param {mongoose.AnyObject} [options]
     * @returns {Promise<void>}
     */
    validate(pathsToValidate, options)
    {
        return this.#entity.validate(pathsToValidate, options);
    }

    /**
     * @param {mongoose.SaveOptions} [options = {}]
     * @returns {Promise<mongoose.Document>}
     */
    save(options = {})
    {
        return this.#entity.save(options);
    }

    /**
     * @param {string} path
     * @param {string|mongoose.AnyObject} [select]
     * @param {mongoose.Model<any>} [model]
     * @param {mongoose.AnyObject} [match]
     * @param {mongoose.PopulateOptions} [options]
     * @returns {Promise<MergeType<mongoose.Document, {}>>}
     */
    populate(path, select, model, match, options)
    {
        return this.#entity.populate(path, select, model, match, options);
    }

    toString()
    {
        return this.#entity.toString();
    }

    /**
     * @param {mongoose.ToObjectOptions|undefined} [options]
     * @returns {Object}
     */
    toObject(options)
    {
        return this.#entity.toObject(options);
    }
}

module.exports = {
    Entity
};