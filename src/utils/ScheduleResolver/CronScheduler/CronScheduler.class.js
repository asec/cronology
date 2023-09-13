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
    isValid()
    {
        return this.#validator.isValid() && this.#builder.isValid();
    }

    /**
     * @return {Date}
     */
    next()
    {
        if (!this.#builder)
        {
            throw new Error("Can't generate next date because the syntax validation failed.")
        }
        return this.#builder.next();
    }

    /**
     * @return {Date}
     */
    prev()
    {
        if (!this.#builder)
        {
            throw new Error("Can't generate next date because the syntax validation failed.")
        }
        return this.#builder.prev();
    }
}

module.exports = {
    CronScheduler
};