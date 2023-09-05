"use strict";
const { EntityRepository } = require("../EntityRepository.class");
const UserModel = require("./User.model");
const { User } = require("./User.class");
const mongoose = require("mongoose");

/**
 * @typedef {UserBean} UserBeanSearch
 * @property {string} [id]
 * @property {Date} [created]
 * @property {Date} [updated]
 */

class UserRepository extends EntityRepository
{
    static get model()
    {
        return UserModel;
    }

    /**
     * @param {mongoose.FilterQuery<UserBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<UserBeanSearch>} [options]
     */
    static deleteMany(filter, options)
    {
        return super.deleteMany(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<UserBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<UserBeanSearch>} [options]
     * @returns {Promise<Number>}
     */
    static countDocuments(filter, options)
    {
        return super.countDocuments(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<UserBeanSearch>} [filter]
     * @param {mongoose.ProjectionType<UserBeanSearch>|null} [projection]
     * @param {mongoose.QueryOptions<UserBeanSearch>|null} [options]
     * @returns {User|null}
     */
    static async findOne(filter, projection = null, options = null)
    {
        let entity = await super.findOne(filter, projection, options);
        if (entity !== null)
        {
            return new User(entity);
        }

        return null;
    }

    /**
     * @param {mongoose.FilterQuery<UserBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<UserBeanSearch>} [options]
     */
    static deleteOne(filter, options)
    {
        return super.deleteOne(filter, options);
    }

    /**
     * @param {(User|UserBean)[]} docs
     * @param {mongoose.InsertManyOptions & {lean: true}} [options]
     * @returns {Promise<Array<Require_id<UserBean>>>}
     */
    static insertMany(docs, options)
    {
        return super.insertMany(docs, options);
    }
}

module.exports = {
    UserRepository
};