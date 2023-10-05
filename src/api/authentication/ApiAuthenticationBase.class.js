"use strict";
const express = require("express");
const { ApiException } = require("../../exception");

class ApiAuthenticationBase
{
    /**
     * @abstract
     * @param {express.Request} request
     * @returns {ApiAuthenticationBase}
     */
    static parse(request) {}

    /**
     * @abstract
     * @param {{}} params
     * @returns {Promise<boolean>}
     * @throws {ApiException}
     */
    async validate(params) {}

    /**
     * @returns {{}}
     */
    toObject()
    {
        return {};
    }
}

module.exports = {
    ApiAuthenticationBase
};