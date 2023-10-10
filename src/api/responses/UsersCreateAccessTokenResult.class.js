"use strict";
const { ApiResult } = require("./ApiResult.class");
const { UserAccessTokenBean } = require("../datastructures/UserAccessTokenBean.class");

/**
 * @typedef {ApiResultBean} UserCreateAccessTokenResultBean
 * @property {UserAccessTokenBeanProps} [result]
 */

class UsersCreateAccessTokenResult extends ApiResult
{
    /**
     * @type {UserAccessTokenBean}
     */
    result = null;

    /**
     * @param {UserCreateAccessTokenResultBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "UsersCreateAccessTokenResult")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {UserCreateAccessTokenResultBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value)
    {
        if (key === "result")
        {
            value = new UserAccessTokenBean(value);
        }

        return super.set(key, value);
    }

    /**
     * @returns {UserCreateAccessTokenResultBean}
     */
    toObject()
    {
        let result = (this.result instanceof UserAccessTokenBean) ? this.result.toObject() : null;
        return {
            success: this.success,
            result
        };
    }
}

module.exports = {
    UsersCreateAccessTokenResult
};