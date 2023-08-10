// Loading the basic configuration
require("dotenv").config();

function environment(env = "dev")
{
    switch (env)
    {
        case "test":
            extendConfiguration([".env.test", ".env.test.local"]);
            process.env.CONF_DB_URI += "_" + String(Math.round(Math.random() * 10000));
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