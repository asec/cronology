"use strict";

class ApiException extends Error
{
    displayable = false;
}

module.exports = {
    ApiException
};