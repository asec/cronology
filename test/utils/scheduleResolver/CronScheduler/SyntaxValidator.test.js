"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { SyntaxValidator } = require("../../../../utils/scheduleResolver/CronScheduler/SyntaxValidator.class");

test("construct", () => {
    let cronTiming = "1 * 3 * */2";
    let validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe(cronTiming);
    expect(validator.isValid()).toBe(true);
});