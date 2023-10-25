"use strict";
const { LoggedException } = require("./LoggedException.class");

class ApiException extends LoggedException
{
    displayable = false;
}

module.exports = {
    ApiException
};