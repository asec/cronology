"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DateBuilder } = require("../../../../src/utils/ScheduleResolver/CronScheduler/DateBuilder.class");
const { SyntaxValidator } = require("../../../../src/utils/ScheduleResolver/CronScheduler/SyntaxValidator.class");
const { fcProvider, getTableFromProvider } = require("./providers");

test.each(getTableFromProvider(fcProvider))(
    "constructor: '%s' %s",
    /**
     * @param {string} cronTiming
     * @param {boolean} expected
     */
    (cronTiming, expected) => {
        let now = new Date();
        let iterationTestSize = 1000;
        let validator = new SyntaxValidator(cronTiming);
        /**
         * @type DateBuilder
         */
        let builder;
        expect(() => builder = new DateBuilder(now, validator.parts)).not.toThrow();
        expect(builder.isValid()).toBe(expected);
        expect(builder.isValid()).toBe(validator.isValid());

        if (builder.isValid())
        {
            expect(() => builder.generateInitialValue()).not.toThrow();
            for (let i = 0; i < iterationTestSize; i++)
            {
                expect(() => builder.prev()).not.toThrow();
            }
            for (let i = 0; i < 2 * iterationTestSize; i++)
            {
                expect(() => builder.next()).not.toThrow();
            }
        }
        else
        {
            expect(() => builder.generateInitialValue()).toThrow();
            expect(() => builder.next()).toThrow();
            expect(() => builder.prev()).toThrow();
        }
    }
);

test.skip("generateInitialValue (long runtime for testing consistency)", () => {
    let cronTiming = "2 10 * * 1";
    let now = new Date();
    now.setTime(now.getTime() - 60 * 1000);
    let validator = new SyntaxValidator(cronTiming);

    for (let i = 0; i < 5 * 365 * 24 * 60; i++)
    {
        now.setTime(now.getTime() + 60 * 1000);
        let builder = new DateBuilder(now, validator.parts);
        expect(() => builder.generateInitialValue()).not.toThrow();
        expect(() => builder.generateInitialValue()).toThrow();
    }
});

test("generateInitialValue", () => {
    let cronTiming = "2 10 * * 1";
    let now = new Date();
    let validator = new SyntaxValidator(cronTiming);
    let builder = new DateBuilder(now, validator.parts);

    expect(() => builder.generateInitialValue()).not.toThrow();
    expect(() => builder.generateInitialValue()).toThrow();
});

test("next", () => {
    let cronTiming = "* * * * *";
    let now = new Date();
    let validator = new SyntaxValidator(cronTiming);
    let builder = new DateBuilder(now, validator.parts);

    expect(() => builder.next()).toThrow();
    expect(() => builder.generateInitialValue()).not.toThrow();
    expect(() => builder.next()).not.toThrow();

    cronTiming = "* * * *";
    validator = new SyntaxValidator(cronTiming);
    builder = new DateBuilder(now, validator.parts);

    expect(() => builder.next()).toThrow();
    expect(() => builder.generateInitialValue()).toThrow();
    expect(() => builder.next()).toThrow();

});

test("prev", () => {
    let cronTiming = "* * * * *";
    let now = new Date();
    let validator = new SyntaxValidator(cronTiming);
    let builder = new DateBuilder(now, validator.parts);

    expect(() => builder.prev()).toThrow();
    expect(() => builder.generateInitialValue()).not.toThrow();
    expect(() => builder.prev()).not.toThrow();

    cronTiming = "* * * *";
    validator = new SyntaxValidator(cronTiming);
    builder = new DateBuilder(now, validator.parts);

    expect(() => builder.prev()).toThrow();
    expect(() => builder.generateInitialValue()).toThrow();
    expect(() => builder.prev()).toThrow();

});

test("Failure on invalid or missing props in SyntaxBuilder", () => {
    let cronTiming = "* * * * *";
    let now = new Date();
    let validator = new SyntaxValidator(cronTiming);
    let builder;

    validator.parts.invalid = validator.parts.hour;
    expect(() => builder = new DateBuilder(now, validator.parts)).toThrow();

    delete validator.parts.invalid;
    delete validator.parts.minute;
    expect(() => builder = new DateBuilder(now, validator.parts)).not.toThrow();
    expect(builder.isValid()).toBe(false);

    cronTiming = "1 2 3 4 5";
    validator = new SyntaxValidator(cronTiming);
    validator.parts.hour.value = 55;
    expect(() => builder = new DateBuilder(now, validator.parts)).not.toThrow();
    expect(builder.isValid()).toBe(false);
});