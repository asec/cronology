"use strict";
const { ConsoleCommand } = require("../ConsoleCommand.class");
const { ScheduleResolver } = require("../../utils/ScheduleResolver");

class ScheduleCommand extends ConsoleCommand
{
    static name = "schedule";
    static description = "Displays the next applicable cron run date for the given schedule syntax and current" +
        " date.";
    static args = [
        [
            "<schedule>",
            "The schedule syntax. Can be: 'now', UTC date in format 'YYYY-MM-DD' or simplified cron syntax."
        ]
    ];

    static continuePromptText = "<Enter>: next date";

    static async action(schedule)
    {
        let now = new Date();
        let scheduler = new ScheduleResolver(schedule, now);

        while (true)
        {
            let next = scheduler.next();
            if (next === null)
            {
                console.error("\n\tError: Invalid parameter `schedule`: '" + schedule + "'.\n");
                break;
            }
            this.printDate("Now", now);
            this.printDate("Next", next);
            console.log("\n");
            if (!scheduler.isRepeatable)
            {
                break;
            }
            else
            {
                console.log(this.continuePromptText);
                let key = this.inputChar();
                if (key.charCodeAt(0) === 13)
                {
                    continue;
                }
                break;
            }
        }
    }

    /**
     * @param {string} label
     * @param {Date} date
     */
    static printDate(label, date)
    {
        console.log("\n\t" + label);
        console.log("\tUTC:", date, "Local:", date.toLocaleDateString(), date.toLocaleTimeString());
    }
}

module.exports = {
    ScheduleCommand
};