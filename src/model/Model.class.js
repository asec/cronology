"use strict";
const mongoose = require("mongoose");

class Model
{
    /**
     * @type {mongoose.Document}
     */
    #model = null;

    /**
     * @returns {number}
     */
    get __v()
    {
        return this.#model.__v;
    }

    /**
     * @returns {mongoose.Document}
     * @protected
     */
    get model()
    {
        return this.#model;
    }

    /**
     * @param {mongoose.Document} model
     */
    constructor(model)
    {
        this.#setModel(model);
    }

    /**
     * @param {mongoose.Document} model
     */
    #setModel(model)
    {
        this.#model = model;
    }

    /**
     * @param {mongoose.PathsToValidate|undefined} [pathsToValidate]
     * @param {mongoose.AnyObject} [options]
     * @returns {Promise<void>}
     */
    validate(pathsToValidate, options)
    {
        return this.#model.validate(pathsToValidate, options);
    }

    /**
     * @param {mongoose.SaveOptions} [options = {}]
     * @returns {Promise<mongoose.Document>}
     */
    save(options = {})
    {
        return this.#model.save(options);
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
        return this.#model.populate(path, select, model, match, options);
    }

    toString()
    {
        return this.#model.toString();
    }

    /**
     * @param {mongoose.ToObjectOptions|undefined} [options]
     * @returns {Object}
     */
    toObject(options)
    {
        return this.#model.toObject(options);
    }
}

module.exports = {
    Model
};