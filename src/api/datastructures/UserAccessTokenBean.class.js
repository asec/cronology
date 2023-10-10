"use strict";
const { Bean } = require("./Bean.class");

/**
 * @typedef {BeanObject} UserAccessTokenBeanProps
 * @property {string} username
 * @property {string} accessToken
 * @property {Date} accessTokenValid
 */

class UserAccessTokenBean extends Bean
{
    /**
     * @type {string}
     */
    username = "";
    /**
     * @type {string}
     */
    accessToken = "";
    /**
     * @type {Date}
     */
    accessTokenValid = null;

    /**
     * @param {UserAccessTokenBeanProps} props
     */
    constructor(props)
    {
        super(props);
        if (this.constructor.name === "UserAccessTokenBean")
        {
            this.setAll(props);
        }
    }

    /**
     * @param {UserAccessTokenBeanProps} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UserAccessTokenBeanProps}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    UserAccessTokenBean
};