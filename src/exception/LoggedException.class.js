"use strict";
const { Log } = require("../model/Log");

class LoggedException extends Error
{
    constructor(message = "")
    {
        super(message);
        Log.logToFile("exception", this.message, {
            code: this.code,
            cause: this.cause,
            stack: this.stack
        });
    }
}

module.exports = {
    LoggedException
};