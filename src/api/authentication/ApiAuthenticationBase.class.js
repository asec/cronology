"use strict";
const express = require("express");
const { Bean } = require("../datastructures/Bean.class");
const { ApiException } = require("../../exception");

class ApiAuthenticationBase extends Bean
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
}

module.exports = {
    ApiAuthenticationBase
};