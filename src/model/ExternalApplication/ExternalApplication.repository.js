"use strict";
const { ModelRepository } = require("../ModelRepository.class");
const ExternalApplicationModel = require("./ExternalApplication.model");
const { ExternalApplication } = require("./ExternalApplication.class");
const mongoose = require("mongoose");

/**
 * @typedef {ExternalApplicationBean} ExternalApplicationBeanSearch
 * @property {string} [id]
 * @property {Date} [created]
 * @property {Date} [updated]
 */

class ExternalApplicationRepository extends ModelRepository
{
    static get model()
    {
        return ExternalApplicationModel;
    }

    /**
     * @param {mongoose.FilterQuery<ExternalApplicationBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<ExternalApplicationBeanSearch>} [options]
     */
    static deleteMany(filter, options)
    {
        return super.deleteMany(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<ExternalApplicationBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<ExternalApplicationBeanSearch>} [options]
     * @returns {Promise<Number>}
     */
    static countDocuments(filter, options)
    {
        return super.countDocuments(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<ExternalApplicationBeanSearch>} [filter]
     * @param {mongoose.ProjectionType<ExternalApplicationBeanSearch>|null} [projection]
     * @param {mongoose.QueryOptions<ExternalApplicationBeanSearch>|null} [options]
     * @returns {Promise<ExternalApplication|null>}
     */
    static async findOne(filter, projection = null, options = null)
    {
        let entity = await super.findOne(filter, projection, options);
        if (entity !== null)
        {
            return new ExternalApplication(entity);
        }

        return null;
    }

    /**
     * @param {mongoose.FilterQuery<ExternalApplicationBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<ExternalApplicationBeanSearch>} [options]
     */
    static deleteOne(filter, options)
    {
        return super.deleteOne(filter, options);
    }

    /**
     * @param {(ExternalApplication|ExternalApplicationBean)[]} docs
     * @param {mongoose.InsertManyOptions & {lean: true}} [options]
     * @returns {Promise<Array<Require_id<ExternalApplicationBean>>>}
     */
    static insertMany(docs, options)
    {
        return super.insertMany(docs, options);
    }
}

module.exports = {
    ExternalApplicationRepository
};