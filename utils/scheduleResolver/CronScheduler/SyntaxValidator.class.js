"use strict";
const { SyntaxValidatorPart } = require("./SyntaxValidatorPart.class");

class SyntaxValidator
{
    /**
     * @return {{cronStep: RegExp, validator: RegExp, cronExact: RegExp, splitter: RegExp}}
     */
    get #formatRegex()
    {
        let cronStep = '(?:\\*(?:\\/[0-9]{1,2})?)';
        let cronExact = '(?:[0-9]{1,2})';

        return {
            cronStep: new RegExp('^' + cronStep + '$'),
            cronExact: new RegExp('^' + cronExact + '$'),
            validator: new RegExp('^(?:(?:' + cronExact + '|' + cronStep + ') ?){5}$'),
            splitter: new RegExp(cronExact + '|' + cronStep, 'g')
        };
    }

    /**
     * @type {Object.<string, [number, number]>}
     */
    #valueRanges = {
        minute: [0, 59],
        hour: [0, 23],
        dayOfMonth: [1, 31],
        month: [1, 12],
        dayOfWeek: [0, 6]
    };

    #cronTimingExpression = "";
    get expression()
    {
        let parts = [];
        for (let i in this.parts)
        {
            if (this.parts[i].raw)
            {
                parts.push(this.parts[i].raw);
            }
            else
            {
                parts.push("{X}");
            }
        }

        return parts.join(" ").trim();
    }

    /**
     * @type {Object.<string, SyntaxValidatorPart>}
     */
    parts = {
        minute: new SyntaxValidatorPart(),
        hour: new SyntaxValidatorPart(),
        dayOfMonth: new SyntaxValidatorPart(),
        month: new SyntaxValidatorPart(),
        dayOfWeek: new SyntaxValidatorPart()
    };

    /**
     * @type {boolean}
     */
    #valid = false;

    /**
     * @param {string} cronTimingExpression - Example: * * * * *
     */
    constructor(cronTimingExpression)
    {
        this.#cronTimingExpression = cronTimingExpression.trim();
        this.#parse();
    }

    /**
     * @return {boolean}
     */
    #parse()
    {
        if (!this.#validateCronExpressionAsAWhole())
        {
            return false;
        }

        let cronParts = this.#splitCronExpression();
        if (!cronParts.length)
        {
            return false;
        }

        let keys = Object.keys(this.parts);
        for (let i = 0; i < cronParts.length; i++)
        {
            const key = keys[i];
            const part = cronParts[i];

            let partData = this.#getPartDataForMatchExact(key, part);
            if (partData !== false)
            {
                this.parts[key].update({...partData});
                continue;
            }

            partData = this.#getPartDataForMatchStep(key, part);
            if (partData !== false)
            {
                this.parts[key].update({...partData});
                //continue;
            }
        }

        let valid = true;
        for (let i in this.parts)
        {
            valid = valid && this.parts[i].valid;
        }

        this.#valid = valid;

        return this.isValid();
    }

    /**
     * @return {boolean}
     */
    #validateCronExpressionAsAWhole()
    {
        let cron = this.#cronTimingExpression.match(this.#formatRegex.validator);
        return (cron && Array.isArray(cron) && cron.length === 1);
    }

    #splitCronExpression()
    {
        let cron = this.#cronTimingExpression.match(this.#formatRegex.splitter);
        if (!cron || !Array.isArray(cron) || cron.length !== 5)
        {
            return [];
        }

        return cron;
    }

    /**
     * @param {string} type
     * @param {number} value
     * @return {boolean}
     */
    #validatePartExact(type, value)
    {
        let range = this.#valueRanges[type];

        return value >= range[0] && value <= range[1];
    }

    /**
     * @param {string} type
     * @param {number} value
     * @return {boolean}
     */
    #validatePartStep(type, value)
    {
        let range = this.#valueRanges[type];

        return value !== 0 && value >= range[0] && value <= range[1];
    }

    /**
     * @param {string} key
     * @param {string} part
     * @return {false|SyntaxValidatorPartData}
     */
    #getPartDataForMatchExact(key, part)
    {
        let match = part.match(this.#formatRegex.cronExact);

        if (!match || !Array.isArray(match) || match.length !== 1)
        {
            return false;
        }

        let exactValue = parseInt(match[0], 10);
        if (!this.#validatePartExact(key, exactValue))
        {
            return false;
        }

        return {
            raw: part,
            type: "exact",
            valid: true,
            value: exactValue,
            range: this.#valueRanges[key]
        };
    }

    /**
     * @param {string} key
     * @param {string} part
     * @return {false|SyntaxValidatorPartData}
     */
    #getPartDataForMatchStep(key, part)
    {
        let match = part.match(this.#formatRegex.cronStep);

        if (!match || !Array.isArray(match) || match.length !== 1)
        {
            return false;
        }

        match = match[0].split("/");
        let stepValue = (!match || !match[1]) ? 1 : parseInt(match[1], 10);
        if (!this.#validatePartStep(key, stepValue))
        {
            return false;
        }

        return {
            raw: part,
            type: "step",
            valid: true,
            value: stepValue,
            range: this.#valueRanges[key]
        };
    }

    /**
     * @returns {boolean}
     */
    isValid()
    {
        return this.#valid;
    }
}

module.exports = {
    SyntaxValidator
};