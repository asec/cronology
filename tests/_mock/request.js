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
    return {
        ip,
        headers: {
            "Crnlg-App": uuid,
            "Crnlg-Signature": signature
        }
    };
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
 * @param {{}} body
 * @returns {MockRequest<express.Request>}
 */
function createMockFullAuthenticationRequest(method, endpoint, ip, uuid, signature, params = {}, body = {})
{
    let requestDescriptor = createMockRequestParameters(ip, uuid, signature);
    /**
     * @type {MockRequest<express.Request>}
     */
    let req = httpMocks.createRequest({
        ...requestDescriptor,
        method,
        url: "https://localhost:7331" + endpoint,
        params,
        body
    });

    return req;
}

module.exports = {
    createAuthenticationRequest: createMockAuthenticationRequest,
    createFullAuthenticationRequest: createMockFullAuthenticationRequest
};