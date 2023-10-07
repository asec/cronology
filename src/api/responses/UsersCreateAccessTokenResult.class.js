"use strict";
const { ApiResult } = require("./ApiResult.class");

/**
 * @typedef {{}} UserAccessTokenBean
 * @property {string} username
 * @property {string} accessToken
 * @property {Date} accessTokenValid
 */

/**
 * @typedef {ApiResultBean} UserCreateAccessTokenResultBean
 * @property {UserAccessTokenBean} [result]
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
        this.setAll(params);
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
     * @returns {UserCreateAccessTokenResultBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    UsersCreateAccessTokenResult
};