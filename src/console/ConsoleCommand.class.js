"use strict";
const fs = require("fs");

class ConsoleCommand
{
    static name = "";
    /**
     * @type {string}
     */
    static description = "";
    /**
     * @type {[string, string][]}
     */
    static args = [];

    static async action(...args)
    {
        console.log(args);
    }

    static inputChar()
    {
        process.stdin.setRawMode(true);
        let buffer = Buffer.alloc(1);
        fs.readSync(0, buffer, 0, 1);
        return buffer.toString("utf8");
    }

    /**
     * @param {*} anything
     */
    static printLine(anything)
    {
        console.log("\n", anything, "\n");
    }
}

module.exports = {
    ConsoleCommand
};