"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const scheduler = require("../../../utils/scheduleResolver/scheduleResolver");



test("resolve: now", () => {
    let now = new Date();
    let first = now;
    let schedule = scheduler.resolve(" \tnow");
    expect(schedule).toStrictEqual(now);

    now = new Date("2022-01-01 00:00:00");
    schedule = scheduler.resolve("now   \n ", now);
    expect(schedule).toStrictEqual(now);

    schedule = scheduler.resolve("now");
    expect(schedule).not.toStrictEqual(first);

    schedule = scheduler.resolve("now2");
    expect(schedule).toBeNull();

    expect(() => scheduler.resolve()).toThrow();

    schedule = scheduler.resolve("");
    expect(schedule).toBeNull();

    expect(() => scheduler.resolve(new Date())).toThrow();
    expect(() => scheduler.resolve(2)).toThrow();
});

test("resolve: date", () => {
    let dateStr = "2022-01-01 00:00:00";
    let schedule = scheduler.resolve(dateStr);
    let target = new Date(dateStr.toLazyUTCString());

    expect(schedule).not.toBeNull();
    expect(schedule).toStrictEqual(target);
    expect(schedule).not.toStrictEqual(new Date(dateStr));

    dateStr = "1970-00-00 00:00:00";
    schedule = scheduler.resolve(dateStr);
    expect(schedule).not.toBeNull();
    expect(schedule).toStrictEqual(new Date("1969-11-30T00:00:00.000Z"));
    expect(schedule).not.toStrictEqual(new Date(dateStr));

    dateStr = "2000-10-23 12:34:56";
    schedule = scheduler.resolve(dateStr);
    target = new Date(dateStr.toLazyUTCString());
    expect(schedule).not.toBeNull();
    expect(schedule).toStrictEqual(target);
    expect(schedule).not.toStrictEqual(new Date(dateStr));

    dateStr = "2035-02-42 01:01:01";
    schedule = scheduler.resolve(dateStr);
    target = new Date(dateStr.toLazyUTCString());
    expect(schedule).not.toBeNull();
    expect(schedule).not.toStrictEqual(target);
    expect(schedule).toStrictEqual(new Date("2035-03-14T01:01:01.000Z"));
    expect(schedule).not.toStrictEqual(new Date(dateStr));

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
        schedule = scheduler.resolve(dateStr);
        expect(schedule).toBeNull();
    }

    expect(() => scheduler.resolve(new Date())).toThrow();
});

test("resolve: cron", () => {
    let cron = "* * * * *";
    let schedule = scheduler.resolve(cron);
    expect(true).toBe(true);
});