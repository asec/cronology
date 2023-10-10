"use strict";
const { ApiResult } = require("./ApiResult.class");

/**
 * @typedef {ApiResultBean} UsersCreateUserResultBean
 * @property {UserBean} [result]
 */

class UsersCreateUserResult extends ApiResult
{
    /**
     * @type {UserBean}
     */
    result = null;

    /**
     * @param {UsersCreateUserResultBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "UsersCreateUserResult")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {UsersCreateUserResultBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {UsersCreateUserResultBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    UsersCreateUserResult
};