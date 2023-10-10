"use strict";
const express = require("express");
const { Bean } = require("../datastructures/Bean.class");
const { ApiAuthenticationBase } = require("../authentication/ApiAuthenticationBase.class");
const { ApiException } = require("../../exception");

/**
 * @typedef {BeanObject} ApiRouteParameterBean
 */

class ApiRouteParameters extends Bean
{
    /**
     * @protected
     * @type {(typeof ApiAuthenticationBase)[]}
     */
    static authentication = [];
    /**
     * @protected
     * @type {ApiAuthenticationBase[]}
     */
    authenticators = [];

    /**
     * @param {ApiRouteParameterBean} params
     */
    constructor(params)
    {
        super(params);
        if (this.constructor.name === "ApiRouteParameters")
        {
            this.setAll(params);
        }
    }

    /**
     * @param {ApiRouteParameterBean} params
     * @returns {boolean}
     */
    setAll(params)
    {
        return super.setAll(params);
    }

    /**
     * @returns {{}}
     */
    get authentication()
    {
        let result = {};
        for (let i = 0; i < this.authenticators.length; i++)
        {
            let authenticator = this.authenticators[i];
            result = {...result, ...authenticator.toObject()};
        }

        return result;
    }

    /**
     * @param {express.Request} request
     * @returns {ApiRouteParameters}
     */
    static parse(request)
    {
        let result = new this();
        for (let i = 0; i < this.authentication.length; i++)
        {
            result.populateAuthenticator(i, this.authentication[i].parse(request));
        }

        this.parseOwn(request, result);
        return result;
    }

    /**
     * @param {number} index
     * @param {ApiAuthenticationBase} authenticator
     * @throws {ApiException}
     */
    populateAuthenticator(index, authenticator)
    {
        if (typeof this.constructor.authentication[index] !== "function")
        {
            throw new ApiException("Invalid index given for authenticator population: " + index + ".");
        }
        if (!(authenticator instanceof this.constructor.authentication[index]))
        {
            throw new ApiException(
                "Invalid authenticator instance given for population. Index: " + index + ", given:" +
                " " + authenticator.constructor.name + ", needed: " + this.constructor.authentication[index].name + "."
            );
        }

        this.authenticators[index] = authenticator;
    }

    /**
     * @abstract
     * @protected
     * @param {express.Request} request
     * @param {ApiRouteParameters} result
     */
    static parseOwn(request, result) {}

    /**
     * @returns {Promise<boolean>}
     * @throws {Error}
     */
    async validate()
    {
        let valid = true;
        if (this.constructor.authentication.length !== this.authenticators.length)
        {
            throw new Error("Not all authenticators have been successfully bound to this class.");
        }
        for (let i = 0; i < this.authenticators.length; i++)
        {
            valid = valid && await this.authenticators[i].validate(this.toObject());
        }

        if (!valid)
        {
            return false;
        }

        return this.validateOwn();
    }

    /**
     * @abstract
     * @protected
     * @returns {Promise<boolean>}
     */
    async validateOwn(){ }

    sanitize()
    {
        if (this.hasOwnProperty("password"))
        {
            this.password = "********";
        }

        return this;
    }

    /**
     * @returns {{}}
     */
    toObject()
    {
        let result = super.toObject();
        delete result.authenticators;
        return result;
    }
}

module.exports = {
    ApiRouteParameters
};