"use strict";
const { Model } = require("../Model.class");
const LogModel = require("./Log.model");

/**
 * @typedef {Object} LogBean
 * @property {string} section
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
     * @param [options]
     * @returns {LogBean}
     */
    toObject(options)
    {
        return super.toObject(options);
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
        if (entity instanceof LogModel)
        {
            return new Log(entity);
        }

        return entity;
    }

    /**
     * @param {string} type
     * @param {string} label
     * @param {Object} [data = {}]
     * @returns {false|Log}
     */
    static logToFile(type, label, data = {})
    {
        let entity = LogModel.logToFile(type, label, data);
        if (entity instanceof LogModel)
        {
            return new Log(entity);
        }

        return entity;
    }

    /**
     * @returns {boolean}
     */
    static deleteFiles()
    {
        return LogModel.deleteFiles();
    }

    /**
     * @param {string} name
     * @returns {Promise<false|Log>}
     */
    static async startSection(name)
    {
        let entity = await LogModel.startSection(name);
        if (entity instanceof LogModel)
        {
            return new Log(entity);
        }

        return entity;
    }

    static endSection()
    {
        LogModel.endSection();
    }

    /**
     * @param {string} [file]
     * @returns {Promise<number>}
     */
    static async pullFromFile(file = "")
    {
        return LogModel.pullFromFile(file);
    }
}

module.exports = {
    Log
};