"use strict";
const { Entity } = require("./Entity.class");
const { DeleteResult } = require("mongodb");
const mongoose = require("mongoose");

class EntityRepository
{
    /**
     * @type {mongoose.Model}
     */
    static get model()
    {
        return undefined;
    }

    /**
     * @param {mongoose.FilterQuery<Object>|undefined} [filter]
     * @param {mongoose.QueryOptions<Object>} [options]
     * @returns {Promise<DeleteResult>}
     */
    static deleteMany(filter, options)
    {
        return this.model.deleteMany(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<Object>} [filter]
     * @param {mongoose.QueryOptions<Object>} [options]
     * @returns {Promise<number>}
     */
    static countDocuments(filter, options)
    {
        return this.model.countDocuments(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<Object>} [filter]
     * @param {mongoose.ProjectionType<Object>|null} [projection]
     * @param {mongoose.QueryOptions<Object>|null} [options]
     * @returns {Promise<Object|null>}
     */
    static findOne(filter, projection = null, options = null)
    {
        return this.model.findOne(filter, projection, options);
    }

    /**
     * @param {mongoose.FilterQuery<Object>} [filter]
     * @param {mongoose.QueryOptions<Object>} [options]
     * @returns {Promise<DeleteResult>}
     */
    static deleteOne(filter, options)
    {
        return this.model.deleteOne(filter, options);
    }

    /**
     * @returns {Promise<DeleteResult>}
     */
    static truncate()
    {
        return this.deleteMany();
    }

    /**
     * @param {(Entity|Object)[]} docs
     * @param {mongoose.InsertManyOptions & {lean: true}} [options]
     * @returns {Promise<Array<Require_id<Object>>>}
     */
    static insertMany(docs, options)
    {
        docs = docs.map(item => {
            if (item instanceof Entity)
            {
                return item.toObject();
            }
            return item;
        });
        return this.model.insertMany(docs, options);
    }
}

module.exports = {
    EntityRepository
};