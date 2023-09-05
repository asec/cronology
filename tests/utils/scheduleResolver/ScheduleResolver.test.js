"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ScheduleResolver } = require("../../../src/utils/ScheduleResolver");
const { fcProvider, getTableFromProvider } = require("./CronScheduler/providers");

test("resolve: now", () => {
    let now = new Date();
    let first = now;
    let schedule = new ScheduleResolver(" \tnow");
    expect(schedule.next()).toStrictEqual(now);

    now = new Date("2022-01-01 00:00:00");
    schedule = new ScheduleResolver("now   \n ", now);
    expect(schedule.isRepeatable).toBe(false);
    expect(schedule.next()).toStrictEqual(now);
    expect(schedule.next()).toStrictEqual(now);

    schedule = new ScheduleResolver("now");
    expect(schedule.isRepeatable).toBe(false);
    expect(schedule.next()).not.toStrictEqual(first);
    expect(schedule.next()).not.toStrictEqual(first);

    schedule = new ScheduleResolver("now2");
    expect(schedule.next()).toBeNull();

    expect(() => new ScheduleResolver()).toThrow();

    schedule = new ScheduleResolver("");
    expect(schedule.next()).toBeNull();

    expect(() => new ScheduleResolver(new Date())).toThrow();
    expect(() => new ScheduleResolver(2)).toThrow();
});

test("resolve: date", () => {
    let dateStr = "2022-01-01 00:00:00";
    let schedule = new ScheduleResolver(dateStr);
    let target = new Date(dateStr.toLazyUTCString());
    let result = schedule.next();

    expect(schedule.isRepeatable).toBe(false);
    expect(result).not.toBeNull();
    expect(result).toStrictEqual(target);
    expect(result).not.toStrictEqual(new Date(dateStr));

    dateStr = "1970-00-00 00:00:00";
    schedule = new ScheduleResolver(dateStr);
    expect(schedule.isRepeatable).toBe(false);
    expect(schedule.next()).not.toBeNull();
    expect(schedule.next()).toStrictEqual(new Date("1969-11-30T00:00:00.000Z"));
    expect(schedule.next()).not.toStrictEqual(new Date(dateStr));

    dateStr = "2000-10-23 12:34:56";
    schedule = new ScheduleResolver(dateStr);
    target = new Date(dateStr.toLazyUTCString());
    result = schedule.next();
    expect(schedule.isRepeatable).toBe(false);
    expect(result).not.toBeNull();
    expect(result).toStrictEqual(target);
    expect(result).not.toStrictEqual(new Date(dateStr));

    dateStr = "2035-02-42 01:01:01";
    schedule = new ScheduleResolver(dateStr);
    target = new Date(dateStr.toLazyUTCString());
    result = schedule.next();
    expect(schedule.isRepeatable).toBe(false);
    expect(result).not.toBeNull();
    expect(result).not.toStrictEqual(target);
    expect(result).toStrictEqual(new Date("2035-03-14T01:01:01.000Z"));
    expect(result).not.toStrictEqual(new Date(dateStr));

    let badDateFormats = [
        "1970-01-01 00:00:0",
        "19700-01-01 00:00:00",
        "1970-01-01 00:00:",
        "1970-01-01 00:0",
        "1970-01-01 00:",
        "1970-01-01 0",
        "1970-01-01 ",
        "1970-01-01",
        "1970-01 00:00:00",
        "970-01-01 00:00:00",
        "   not a date by any chance ",
        new Date().toISOString(),
        new Date("invalid").toUTCString(),
    ];
    for (let i = 0; i < badDateFormats.length; i++)
    {
        dateStr = badDateFormats[i];
        schedule = new ScheduleResolver(dateStr);
        expect(schedule.isRepeatable).toBe(false);
        expect(schedule.next()).toBeNull();
    }

    expect(() => new ScheduleResolver(new Date())).toThrow();
});

test.each(getTableFromProvider(fcProvider))(
    "resolve: cron (%s)",
    /**
     * @param {string} cron
     * @param {boolean} expected
     */
    (cron, expected) => {
        let schedule = new ScheduleResolver(cron);
        let testSize = 100;
        let now = new Date();
        if (expected)
        {
            expect(schedule.isRepeatable).toBe(true);
            for (let i = 0; i < testSize; i++)
            {
                let result = schedule.next();
                expect(result).toBeInstanceOf(Date);
                expect(result - now).toBeGreaterThan(30);
                now = new Date(result);
            }
        }
        else
        {
            expect(schedule.isRepeatable).toBe(false);
            expect(schedule.next()).toBeNull();
        }
    }
);