"use strict";
const { EntityRepository } = require("../EntityRepository.class");
const LogModel = require("./Log.model");
const { Log } = require("./Log.class");

/**
 * @typedef {LogBean} LogBeanSearch
 * @property {string} [id]
 * @property {Date} [created]
 */

class LogRepository extends EntityRepository
{
    /**
     * @returns {LogModel}
     */
    static get model()
    {
        return LogModel;
    }

    /**
     * @param {mongoose.FilterQuery<LogBeanSearch>} [filter]
     * @param {mongoose.QueryOptions<LogBeanSearch>} [options]
     * @returns {Promise<number>}
     */
    static countDocuments(filter, options)
    {
        return super.countDocuments(filter, options);
    }

    static async truncate()
    {
        let result = await super.truncate();
        this.truncateFiles();
        return result;
    }

    static truncateFiles()
    {
        return Log.deleteFiles();
    }
}

module.exports = {
    LogRepository
};