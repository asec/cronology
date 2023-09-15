"use strict";
const { EntityRepository } = require("../EntityRepository.class");
const ProjectModel = require("./Project.model");
const { Project } = require("./Project.class");
const mongoose = require("mongoose");

/**
 * @typedef {ProjectBean} ProjectBeanSearch
 * @property {string} [id]
 * @property {Date} [created]
 * @property {Date} [updated]
 */

class ProjectRepository extends EntityRepository
{
    static get model()
    {
        return ProjectModel;
    }

    /**
     * @param {mongoose.FilterQuery<ProjectBeanSearch>|undefined} [filter]
     * @param {mongoose.QueryOptions<ProjectBeanSearch>} [options]
     */
    static deleteMany(filter, options)
    {
        return super.deleteMany(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<ProjectBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<ProjectBeanSearch>} [options]
     * @returns {Promise<Number>}
     */
    static countDocuments(filter, options)
    {
        return super.countDocuments(filter, options);
    }

    /**
     * @param {mongoose.FilterQuery<ProjectBeanSearch>} [filter]
     * @param {mongoose.ProjectionType<ProjectBeanSearch>|null} [projection]
     * @param {mongoose.QueryOptions<ProjectBeanSearch>|null} [options]
     * @returns {Promise<Project|null>}
     */
    static async findOne(filter, projection = null, options = null)
    {
        let entity = await super.findOne(filter, projection, options);
        if (entity !== null)
        {
            return new Project(entity);
        }

        return null;
    }

    /**
     * @param {mongoose.FilterQuery<ProjectBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<ProjectBeanSearch>} [options]
     */
    static deleteOne(filter, options)
    {
        return super.deleteOne(filter, options);
    }

    /**
     * @param {(Project|ProjectBean)[]} docs
     * @param {mongoose.InsertManyOptions & {lean: true}} [options]
     * @returns {Promise<Array<Require_id<ProjectBean>>>}
     */
    static insertMany(docs, options)
    {
        return super.insertMany(docs, options);
    }
}

module.exports = {
    ProjectRepository
};