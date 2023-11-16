"use strict";
const { AppAuthentication } = require("./AppAuthentication.class");
const { AppValidation } = require("./AppValidation.class");
const { UserValidation } = require("./UserValidation.class");
const { MixedAuthentication } = require("./MixedAuthentication.class");

module.exports = {
    AppAuthentication,
    AppValidation,
    UserValidation,
    MixedAuthentication
};