"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DateBuilder } = require("../../../../utils/scheduleResolver/CronScheduler/DateBuilder.class");
const { SyntaxValidator } = require("../../../../utils/scheduleResolver/CronScheduler/SyntaxValidator.class");

test("constructor", () => {
    let cronTiming = "* * * * *";
    let now = new Date();
    let validator = new SyntaxValidator(cronTiming);
    /**
     * @type DateBuilder
     */
    let builder;
    expect(() => builder = new DateBuilder(now, validator.parts)).not.toThrow();
    expect(builder.isValid()).toBe(true);
});