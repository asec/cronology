"use strict";
// Loading the basic configuration
require("dotenv").config();

const dotenv = {
    /**
     * @param {'dev', 'test'} [env = "dev"]
     */
    environment: function (env = "dev")
    {
        extendConfiguration(".env");
        switch (env)
        {
            case "test":
                extendConfiguration([".env.test", ".env.test.local"]);
                break;
            default:
                extendConfiguration(".env.local");
        }

        return this;
    },

    /**
     * @param {string} filename
     */
    extendWith(filename)
    {
        extendConfiguration([filename, filename + ".local"]);
    },

    enableLogging: function ()
    {
        toggleLogging(true);
    },

    disableLogging: function ()
    {
        toggleLogging(false);
    },

    enableSilentLogging: function ()
    {
        toggleSilentLogging(true);
    },

    disableSilentLogging: function ()
    {
        toggleSilentLogging(false);
    }
};

/**
 * @param {string|string[]} fileName
 * @returns {boolean}
 */
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

/**
 * @param {boolean} state
 */
function toggleLogging(state)
{
    process.env.CONF_LOG_DISABLED = !state ? "true" : "false";
}

/**
 * @param {boolean} state
 */
function toggleSilentLogging(state)
{
    process.env.CONF_LOG_SILENT = state ? "true" : "false";
}

module.exports = dotenv;