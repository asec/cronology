"use strict";
// Loading the basic configuration
require("dotenv").config();

function environment(env = "dev")
{
    switch (env)
    {
        case "test":
            extendConfiguration([".env.test", ".env.test.local"]);
            break;
        default:
            extendConfiguration(".env.local");
    }
}

function extendConfiguration(fileName)
{
    if (!Array.isArray(fileName))
    {
        fileName = [fileName];
    }

    let success = true;

    fileName.forEach(actualFileName => {
        require("dotenv").config({
            path: actualFileName,
            override: true,
        });
    });

    return success;
}

module.exports = {
    environment
};