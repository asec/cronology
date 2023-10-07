"use strict";

/**
 * @typedef {{}} BeanObject
 */

class Bean
{
    /**
     * @param {BeanObject} props
     */
    constructor(props)
    {
        this.setAll(props);
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value)
    {
        if (!this.hasOwnProperty(key))
        {
            return false;
        }

        this[key] = value;

        return true;
    }

    /**
     * @param {BeanObject} params
     * @returns {boolean}
     */
    setAll(params)
    {
        let success = true;
        for (let i in params)
        {
            success = success && this.set(i, params[i]);
        }

        return success;
    }

    /**
     * @returns {{}}
     */
    toObject()
    {
        return {...this};
    }
}

module.exports = {
    Bean
};