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
        if (this.constructor.name === "Bean")
        {
            this.setAll(props);
        }
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
            if (!this.set(i, params[i]))
            {
                success = false;
            }
        }

        return success;
    }

    /**
     * @returns {BeanObject}
     */
    toObject()
    {
        return {...this};
    }
}

module.exports = {
    Bean
};