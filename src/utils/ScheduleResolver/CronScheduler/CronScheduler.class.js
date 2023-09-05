"use strict";
require("../../String");
const { SyntaxValidator } = require("./SyntaxValidator.class");
const { DateBuilder } = require("./DateBuilder.class");

class CronScheduler
{
    /**
     * @type SyntaxValidator
     */
    #validator = null;
    /**
     * @type {DateBuilder}
     */
    #builder = null;

    /**
     * @param {string} schedule - For example: * * * * *
     * @param {Date|null} [now = null] - If it's `null` the generator algorithm will use the current date.
     */
    constructor(schedule, now = null)
    {
        if (!(now instanceof Date))
        {
            now = new Date();
        }

        this.#validator = new SyntaxValidator(schedule);
        if (!this.#validator.isValid())
        {
            return;
        }

        this.#builder = new DateBuilder(now, this.#validator.parts);
        if (!this.#builder.isValid())
        {
            return;
        }

        this.#builder.generateInitialValue();
    }

    /**
     * @return {boolean}
     */
    isFormatValid()
    {
        return this.#validator.isValid() && this.#builder.isValid();
    }

    /**
     * @return {Date}
     */
    next()
    {
        return this.#builder.next();
    }

    /**
     * @return {Date}
     */
    prev()
    {
        return this.#builder.prev();
    }
}

module.exports = {
    CronScheduler
};