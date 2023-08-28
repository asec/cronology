"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { CronScheduler } = require("../../../../utils/scheduleResolver/CronScheduler/CronScheduler.class");

test("construct", () => {
    let cronTiming = "* * * * ";
    let schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "* * * * * ";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(true);

    cronTiming = "1 2 3 4 5";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(true);

    cronTiming = "*/1 */2 */3 */4 */5";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(true);

    cronTiming = "*/0 */2 */3 */4 */5";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "*/1 */2 */ */4 */5";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "70 * * * *";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "0 0 1 1 0";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(true);

    cronTiming = "0 24 1 1 0";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "0 0 32 1 0";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "0 0 1 13 0";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "0 0 1 1 7";
    schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);

    cronTiming = "* * * * *";
    schedule = new CronScheduler(cronTiming, new Date());
    expect(schedule.isFormatValid()).toBe(true);

    for (let i = 0; i < 5; i++)
    {
        let cron = [];
        for (let j = 0; j < 5; j++)
        {
            cron.push("*" + ((j === i) ? "/32" : ""));
        }
        cronTiming = cron.join(" ");
        schedule = new CronScheduler(cronTiming, new Date());
        expect(schedule.isFormatValid()).toBe(i < 1);
    }

    for (let i = 0; i < 5; i++)
    {
        let cron = [];
        for (let j = 0; j < 5; j++)
        {
            cron.push("*" + ((j === i) ? "/23" : ""));
        }
        cronTiming = cron.join(" ");
        schedule = new CronScheduler(cronTiming, new Date());
        expect(schedule.isFormatValid()).toBe(i < 3);
    }

    for (let i = 0; i < 5; i++)
    {
        let cron = [];
        for (let j = 0; j < 5; j++)
        {
            cron.push("*" + ((j === i) ? "/99" : ""));
        }
        cronTiming = cron.join(" ");
        schedule = new CronScheduler(cronTiming, new Date());
        expect(schedule.isFormatValid()).toBe(false);
    }
});

test("generate: minutes", () => {
    let cronTiming = "* * * * ";
    let schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);
    expect(() => schedule.next()).toThrow();

    //let now = new Date("2023-03-26 00:59:00");
    //let now = new Date("2023-04-30T23:58:00.000Z");
    //let now = new Date("2023-09-28T20:00:00.000Z");

    cronTiming = "* * * * *";
    let now = new Date("2023-03-26T00:59:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    now.setUTCSeconds(0, 0);
    expect(schedule.isFormatValid()).toBe(true);
    let date;
    for (let i = 0; i < 5 * 365 * 24 * 60; i++)
    {
        date = schedule.next();
        //console.log(date - now);
        now.setTime(now.getTime() + 60 * 1000);
        expect(date).toStrictEqual(now);
    }
});

test("generate: minutes backwards", () => {
    let cronTiming = "* * * * ";
    let schedule = new CronScheduler(cronTiming);
    expect(schedule.isFormatValid()).toBe(false);
    expect(() => schedule.prev()).toThrow();

    cronTiming = "* * * * *";
    //let now = new Date("2023-03-26T00:59:00.000Z");
    let now = new Date("2023-02-01T00:02:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    now.setUTCSeconds(0, 0);
    expect(schedule.isFormatValid()).toBe(true);
    let date;
    for (let i = 0; i < 5 * 365 * 24 * 60; i++)
    {
        date = schedule.prev();
        now.setTime(now.getTime() - 60 * 1000);
        expect(date).toStrictEqual(now);
    }
});

test("generate: forward", () => {
    // Month overflow
    let cronTiming = "1 1 * 1 0";
    let now = new Date("2023-07-22T02:05:00.000Z");
    let schedule = new CronScheduler(cronTiming, new Date(now));
    let expectedResults = [
        new Date("2024-01-07T01:01:00.000Z"),
        new Date("2024-01-14T01:01:00.000Z"),
        new Date("2024-01-21T01:01:00.000Z"),
        new Date("2024-01-28T01:01:00.000Z"),
        new Date("2025-01-05T01:01:00.000Z"),
    ];
    let date;
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, but future month
    cronTiming = "1 1 * 9 0";
    now = new Date("2023-08-25T20:00:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-09-03T01:01:00.000Z"),
        new Date("2023-09-10T01:01:00.000Z"),
        new Date("2023-09-17T01:01:00.000Z"),
        new Date("2023-09-24T01:01:00.000Z"),
        new Date("2024-09-01T01:01:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, day overflow
    cronTiming = "1 1 * * 0";
    now = new Date("2023-08-28T03:00:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-09-03T01:01:00.000Z"),
        new Date("2023-09-10T01:01:00.000Z"),
        new Date("2023-09-17T01:01:00.000Z"),
        new Date("2023-09-24T01:01:00.000Z"),
        new Date("2023-10-01T01:01:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, no day overflow, future day
    cronTiming = "1 1 * * 0";
    now = new Date("2023-08-22T04:05:00.000Z");
    expectedResults = [
        new Date("2023-08-27T01:01:00.000Z"),
        new Date("2023-09-03T01:01:00.000Z"),
        new Date("2023-09-10T01:01:00.000Z"),
        new Date("2023-09-17T01:01:00.000Z"),
        new Date("2023-09-24T01:01:00.000Z"),
    ];
    schedule = new CronScheduler(cronTiming, new Date(now));
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, no day overflow, current day, hour overflow
    cronTiming = "1 1 * * 1";
    now = new Date("2023-08-28T02:10:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-09-04T01:01:00.000Z"),
        new Date("2023-09-11T01:01:00.000Z"),
        new Date("2023-09-18T01:01:00.000Z"),
        new Date("2023-09-25T01:01:00.000Z"),
        new Date("2023-10-02T01:01:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, no day overflow, current day, no hour overflow, future hour (with minutes overflowing)
    cronTiming = "1 10 * * 1";
    now = new Date("2023-08-28T02:10:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-08-28T10:01:00.000Z"),
        new Date("2023-09-04T10:01:00.000Z"),
        new Date("2023-09-11T10:01:00.000Z"),
        new Date("2023-09-18T10:01:00.000Z"),
        new Date("2023-09-25T10:01:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, no day overflow, current day, no hour overflow, current hour, minutes overflow
    cronTiming = "1 2 * * *";
    now = new Date("2023-08-28T02:10:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-08-29T02:01:00.000Z"),
        new Date("2023-08-30T02:01:00.000Z"),
        new Date("2023-08-31T02:01:00.000Z"),
        new Date("2023-09-01T02:01:00.000Z"),
        new Date("2023-09-02T02:01:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }

    // No month overflow, current month, no day overflow, current day, no hour overflow, current hour, future minutes
    cronTiming = "15 2 * * *";
    now = new Date("2023-08-28T02:10:00.000Z");
    schedule = new CronScheduler(cronTiming, new Date(now));
    expectedResults = [
        new Date("2023-08-28T02:15:00.000Z"),
        new Date("2023-08-29T02:15:00.000Z"),
        new Date("2023-08-30T02:15:00.000Z"),
        new Date("2023-08-31T02:15:00.000Z"),
        new Date("2023-09-01T02:15:00.000Z"),
    ];
    for (let i = 0; i < expectedResults.length; i++)
    {
        date = schedule.next();
        expect(date).toStrictEqual(expectedResults[i]);
    }
});

test("generate: teszt", () => {
    let cronTiming = "1 23 1 * */5";
    let now = new Date();
    let schedule = new CronScheduler(cronTiming, new Date(now));
    let date;
    for (let i = 0; i < 100; i++)
    {
        date = schedule.next();
        //expect(date).toStrictEqual(expectedResults[i]);
        console.log(i, date, date.toLocaleDateString(), date.toLocaleTimeString());
    }
});