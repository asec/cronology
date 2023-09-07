"use strict";
const { ApiException } = require("./ApiException.class");

class DisplayableApiException extends ApiException
{
    displayable = true;
}

module.exports = {
    DisplayableApiException
};