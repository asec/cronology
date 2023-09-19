"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const fs = require("fs");
const path = require("path");
const { ApiError, ApiResponse } = require("../../api/responses");

const defaultEnvironmentVariables = {...process.env};

class SetConsoleEnvCommand extends ConsoleCommand
{
    static name = "set-console-env";
    static description = "Sets the console environment to either 'test', 'dev' or 'prod'. This affects" +
        "(among other things possibly) which db it will use.";
    static args = [
        [
            "<environment>",
            "{'test' | 'dev' | 'prod'}. The identifier of the environment to set."
        ]
    ];

    static action(env)
    {
        let possibleValues = ["test", "dev", "prod"];
        if (possibleValues.indexOf(env) === -1)
        {
            return this.#resultInError("[Error] Invalid parameter: 'env'. The possible values are: "
                + possibleValues.join(", ")+ ", the current value was: '" + env + "'.");
        }

        let fileName = path.resolve("./.env.console.local");
        this.#changeCurrentEnv(env);

        let newVariables = this.#extractVariablesFromCurrentEnv();
        /**
         * @type {string[]}
         */
        let content = [];
        if (!fs.existsSync(fileName))
        {
            for (let varName in newVariables)
            {
                content.push(this.#getVariableString(varName, newVariables[varName]));
            }
        }
        else
        {
            try
            {
                content = fs.readFileSync(fileName).toString().split("\n");
            }
            /**
             * @type Error
             */
            catch (e)
            {
                return this.#resultInError("[Error] The target file exists but could not be read:" +
                    " '.env.console.local'.");
            }
            let varsFound = [];
            for (let i = 0; i < content.length; i++)
            {
                let line = content[i];
                for (let varName in newVariables)
                {
                    if (line.startsWith(varName + "="))
                    {
                        content[i] = this.#getVariableString(varName, newVariables[varName]);
                        varsFound.push(varName);
                        break;
                    }
                }
            }
            let vars = Object.keys(newVariables);
            let newVars = vars.filter(varname => varsFound.indexOf(varname) === -1);
            for (let i = 0; i < newVars.length; i++)
            {
                let varName = newVars[i];
                content.push(this.#getVariableString(varName, newVariables[varName]));
            }
        }

        try
        {
            fs.writeFileSync(fileName, content.join("\n"));
        }
        /**
         * @type Error
         */
        catch (e)
        {
            return this.#resultInError("[Error] The target file could not be written: '.env.console.local'.");
        }

        this.#restoreCurrentEnv();

        let result = new ApiResponse({
            success: true
        });
        this.printLine(result.toObject());
    }

    static #changeCurrentEnv(env)
    {
        require("../../../config/dotenv").environment(env);
    }

    static #restoreCurrentEnv()
    {
        process.env = {...defaultEnvironmentVariables};
    }

    /**
     * @returns {Object.<string, any>}
     */
    static #extractVariablesFromCurrentEnv()
    {
        return {
            APP_ENV: process.env.APP_ENV,
            CONF_DB_URI: process.env.CONF_DB_URI,
            CONF_CRYPTO_APPKEYS: process.env.CONF_CRYPTO_APPKEYS
        };
    }

    /**
     * @param {string} name
     * @param {any} value
     * @returns {string}
     */
    static #getVariableString(name, value)
    {
        return name + "=" + value;
    }

    /**
     * @param {string} message
     */
    static #resultInError(message)
    {
        let error = new ApiError({
            error: message,
            displayable: true
        });
        this.printLine(error.toObject());
    }
}

module.exports = {
    SetConsoleEnvCommand
};