"use strict";
const express = require("express");
const httpMocks = require("node-mocks-http");

/**
 * @param {string} [ip]
 * @param {string} [uuid]
 * @param {string} [signature]
 * @returns {{}}
 */
function createMockRequestParameters(ip, uuid, signature)
{
    let data = {};

    if (typeof ip !== "undefined")
    {
        data.ip = ip;
    }
    if (typeof uuid !== "undefined")
    {
        if (!("headers" in data))
        {
            data.headers = {};
        }
        data.headers["Crnlg-App"] = uuid;
    }
    if (typeof signature !== "undefined")
    {
        if (!("headers" in data))
        {
            data.headers = {};
        }
        data.headers["Crnlg-Signature"] = signature;
    }

    return data;
}

/**
 * @param {string} [ip]
 * @param {string} [uuid]
 * @param {string} [signature]
 * @returns {MockRequest<express.Request>}
 */
function createMockAuthenticationRequest(ip, uuid, signature)
{
    /**
     * @type {MockRequest<express.Request>}
     */
    let req = httpMocks.createRequest(createMockRequestParameters(ip, uuid, signature));
    return req;
}

/**
 * @param {string} method
 * @param {string} endpoint
 * @param {string} ip
 * @param {string} uuid
 * @param {string} signature
 * @param {{}} params
 * @param {{}} query
 * @param {{}} body
 * @param {{}} headers
 * @returns {MockRequest<express.Request>}
 */
function createMockFullRequest(method, endpoint, ip, uuid, signature, params = {}, query = {}, body = {}, headers = {})
{
    let requestDescriptor = createMockRequestParameters(ip, uuid, signature);
    requestDescriptor.headers = {
        ...requestDescriptor.headers || {},
        ...headers
    }
    /**
     * @type {MockRequest<express.Request>}
     */
    let req = httpMocks.createRequest({
        ...requestDescriptor,
        method,
        url: "https://localhost:7331" + endpoint,
        params,
        query,
        body
    });

    return req;
}

module.exports = {
    createAuthenticationRequest: createMockAuthenticationRequest,
    createFullRequest: createMockFullRequest
};