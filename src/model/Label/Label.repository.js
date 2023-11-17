"use strict";
const { ModelRepository } = require("../ModelRepository.class");
const LabelModel = require("./Label.model");
const { Label } = require("./Label.class");
const mongoose = require("mongoose");

/**
 * @typedef {LabelBean} LabelBeanSearch
 * @property {string} [id]
 * @property {Date} [created]
 * @property {Date} [updated]
 */

class LabelRepository extends ModelRepository
{
    static get model()
    {
        return LabelModel;
    }

    /**
     * @param {mongoose.FilterQuery<LabelBeanSearch>|undefined} [filter]
     * @param {mongoose.QueryOptions<LabelBeanSearch>} [options]
     */
    static deleteMany(filter, options)
    {
        return super.deleteMany(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<LabelBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<LabelBeanSearch>} [options]
     * @returns {Promise<Number>}
     */
    static countDocuments(filter, options)
    {
        return super.countDocuments(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<LabelBeanSearch>} [filter]
     * @param {mongoose.ProjectionType<LabelBeanSearch>|null} [projection]
     * @param {mongoose.QueryOptions<LabelBeanSearch>|null} [options]
     * @returns {Promise<Label|null>}
     */
    static async findOne(filter, projection = null, options = null)
    {
        let entity = await super.findOne(filter, projection, options);
        if (entity !== null)
        {
            return new Label(entity);
        }

        return null;
    }

    /**
     * @param {mongoose.FilterQuery<LabelBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<LabelBeanSearch>} [options]
     */
    static deleteOne(filter, options)
    {
        return super.deleteOne(filter, options);
    }

    /**
     * @param {(Label|LabelBean)[]} docs
     * @param {mongoose.InsertManyOptions & {lean: true}} [options]
     * @returns {Promise<Array<Require_id<LabelBean>>>}
     */
    static insertMany(docs, options)
    {
        return super.insertMany(docs, options);
    }
}

module.exports = {
    LabelRepository
};