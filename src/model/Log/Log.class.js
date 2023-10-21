"use strict";
const { Model } = require("../Model.class");
const LogModel = require("./Log.model");

/**
 * @typedef {Object} LogBean
 * @property {string} type
 * @property {string} label
 * @property {Object} [data]
 */

class Log extends Model
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
    get type()
    {
        return this.model.get("type");
    }

    /**
     * @returns {string}
     */
    get label()
    {
        return this.model.get("label");
    }

    /**
     * @returns {Object}
     */
    get data()
    {
        return this.model.get("data");
    }

    /**
     * @returns {Date}
     */
    get created()
    {
        return this.model.get("created");
    }

    /**
     * @param {LogBean|LogModel} [initial]
     */
    constructor(initial)
    {
        super(initial instanceof LogModel ? initial : new LogModel(initial));
    }

    /**
     * @returns {string}
     */
    static getLogFile()
    {
        return LogModel.getLogFile();
    }

    /**
     * @param {string} fileName
     */
    static setLogFile(fileName)
    {
        LogModel.setLogFile(fileName);
    }

    /**
     * @param {string} type
     * @param {string} label
     * @param {Object} [data = {}]
     * @returns {Promise<false|Log>}
     */
    static async log(type, label, data = {})
    {
        let entity = await LogModel.log(type, label, data);
        if (entity === false)
        {
            return false;
        }
        return new Log(entity);
    }

    /**
     * @returns {boolean}
     */
    static deleteFiles()
    {
        return LogModel.deleteFiles();
    }
}

module.exports = {
    Log
};