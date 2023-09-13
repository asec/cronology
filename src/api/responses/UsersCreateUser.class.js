"use strict";
const { ApiResponse } = require("./ApiResponse.class");

/**
 * @typedef {ApiResponseBean} UsersCreateUserBean
 * @property {UserBean} [result]
 */

class UsersCreateUser extends ApiResponse
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
        /**
         * @type {UsersCreateUserBean}
         */
        let data = super.toObject();

        if (data.result)
        {
            data.result = this.sanitizeDbObject(data.result);
            delete data.result.password;
        }

        return data;
    }

    /**
     * @param {UserBean} object
     * @returns {UserBean}
     */
    sanitizeDbObject(object)
    {
        return super.sanitizeDbObject(object);
    }
}

module.exports = {
    UsersCreateUser
};