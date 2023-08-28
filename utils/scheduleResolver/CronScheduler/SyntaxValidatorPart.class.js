"use strict";

/**
 * @typedef {Object} SyntaxValidatorPartData
 * @property {string} raw
 * @property {'exact', 'step'} type
 * @property {boolean} valid
 * @property {number} value
 * @property {[number, number]} range
 */

class SyntaxValidatorPart
{
    raw = "";
    /**
     * @type {'exact', 'step', ''}
     */
    type = "";
    valid = false;
    value = 0;
    /**
     * @type {[number, number]}
     */
    range = [];

    /**
     * @param {SyntaxValidatorPartData} params
     */
    update(params)
    {
        for (let i in params)
        {
            if (this.hasOwnProperty(i))
            {
                this[i] = params[i];
            }
        }
    }
}

module.exports = {
    SyntaxValidatorPart
};