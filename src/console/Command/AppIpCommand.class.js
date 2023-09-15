"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { ExternalApplicationRepository } = require("../../model/ExternalApplication");
const { ApiError, ApiResult } = require("../../api/responses");
const db = require("../../utils/db");
const validator = require("validator");

/**
 * @typedef {{}} AppIpCommandOptions
 * @property {string} [add]
 * @property {string} [remove]
 */

class AppIpCommand extends ConsoleCommand
{
    static name = "app-ip";
    static description = "Lists the IPs that are currently allowed for this app. You can add more with the" +
        " -a, --add option, or remove one with the -r, --remove option.";
    static args = [
        [
            "<app-name>",
            "The name of the app to check or modify."
        ]
    ];
    static options = [
        [
            "-a, --add <ip>",
            "Add the specified IP address to the list of IPs allowed by this app. This enables requests made from" +
            " this IP to authenticate using this app if the signature is correct."
        ],
        [
            "-r, --remove <ip>",
            "Remove the specified IP address from the list of IPs allowed by this app. This denies requests made" +
            " from this IP on routes where app authentication is required."
        ]
    ];

    /**
     * @param {string} appName
     * @param {AppIpCommandOptions} options
     * @returns {Promise<void>}
     */
    static async action(appName, options)
    {
        await db.connect();
        let app = await ExternalApplicationRepository.findOne({ name: appName });
        if (app === null)
        {
            return this.#resultInError("Invalid parameter: 'app'. The following app does not exists: '" + appName + "'");
        }

        if (options.add)
        {
            try
            {
                await this.#addIp(app, options.add);
            }
            /**
             * @type Error
             */
            catch (e)
            {
                this.printLine(e.message);
                let response = new ApiResult({
                    success: false,
                    result: app.ip
                });
                this.printLine(response.toObject());
                return;
            }
        }

        if (options.remove)
        {
            try
            {
                await this.#removeIp(app, options.remove);
            }
            /**
             * @type Error
             */
            catch (e)
            {
                this.printLine(e.message);
                let response = new ApiResult({
                    success: false,
                    result: app.ip
                });
                this.printLine(response.toObject());
                return;
            }
        }

        let response = new ApiResult({
            success: true,
            result: app.ip
        });
        this.printLine(response.toObject());
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

    /**
     * @param {string} ip
     * @returns {boolean}
     * @throws {Error}
     */
    static #validateIp(ip)
    {
        if (!validator.isIP(ip))
        {
            throw new Error("The following IP is invalid: '" + ip + "'.");
        }

        return true;
    }

    /**
     * @param {ExternalApplication} app
     * @param {string} ip
     * @returns {Promise<boolean>}
     * @throws {Error}
     */
    static async #addIp(app, ip)
    {
        if (!this.#validateIp(ip))
        {
            return false;
        }

        if (!app.addIp(ip))
        {
            throw new Error("The following IP could not be added to the application: '" + ip + "'.");
        }

        await app.save();

        return true;
    }

    /**
     * @param {ExternalApplication} app
     * @param {string} ip
     * @returns {Promise<boolean>}
     * @throws {Error}
     */
    static async #removeIp(app, ip)
    {
        if (!this.#validateIp(ip))
        {
            return false;
        }

        if (!app.removeIp(ip))
        {
            throw new Error("The following IP could not be removed from the application: '" + ip + "'.");
        }

        await app.save();

        return true;
    }
}

module.exports = {
    AppIpCommand
};