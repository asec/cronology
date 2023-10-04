"use strict";
const { ApiResult } = require("./ApiResult.class");

/**
 * @typedef {ApiResultBean} UsersCreateUserResultBean
 * @property {UserBean} [result]
 */

class UsersCreateUserResult extends ApiResult
{
    /**
     * @type {UsersCreateUserResultBean}
     */
    data = {
        success: false,
        result: null
    };

    /**
     * @param {UsersCreateUserResultBean} values
     */
    constructor(values)
    {
        super(values);
        this.set(values);
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