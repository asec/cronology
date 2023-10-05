"use strict";
const express = require("express");
const { ApiAuthenticationBase } = require("../authentication/ApiAuthenticationBase.class");
const { ApiException } = require("../../exception");

/**
 * @typedef {{}} ApiRouteParameterBean
 */

class ApiRouteParameters
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
        this.setAll(params);
        this.constructor.setupAuthentication();
    }

    /**
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value)
    {
        if (!this.hasOwnProperty(key))
        {
            return false;
        }

        this[key] = value;

        return true;
    }

    /**
     * @param {ApiRouteParameterBean} params
     */
    setAll(params)
    {
        for (let i in params)
        {
            this.set(i, params[i]);
        }
    }

    /**
     * @abstract
     * @protected
     */
    static setupAuthentication() {}

    /**
     * @protected
     * @param {typeof ApiAuthenticationBase} className
     */
    static addAuthentication(className)
    {
        if (this.authentication.indexOf(className) === -1)
        {
            this.authentication.push(className);
        }
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
        let result = {...this};
        delete result.authenticators;
        return result;
    }
}

module.exports = {
    ApiRouteParameters
};