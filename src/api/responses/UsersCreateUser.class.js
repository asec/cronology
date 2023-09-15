"use strict";
const { ApiResult } = require("./ApiResult.class");

/**
 * @typedef {ApiResultBean} UsersCreateUserBean
 * @property {UserBean} [result]
 */

class UsersCreateUser extends ApiResult
{
    /**
     * @type {UsersCreateUserBean}
     */
    data = {
        success: false,
        result: null
    };

    /**
     * @param {UsersCreateUserBean} values
     */
    constructor(values)
    {
        super(values);
        this.set(values);
    }

    /**
     * @returns {UsersCreateUserBean}
     */
    toObject()
    {
        return super.toObject();
    }
}

module.exports = {
    UsersCreateUser
};